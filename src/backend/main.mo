import Array "mo:core/Array";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Text "mo:core/Text";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";



actor {
  type Status = { #Pending; #InProgress; #Completed; #Cancelled };
  type PaymentStatus = { #Pending; #Processing; #Cancelled; #Approved };

  type Order = {
    id : Nat;
    userId : Principal;
    videoFileId : Text;
    videoFileName : Text;
    description : Text;
    contactName : Text;
    contactEmail : Text;
    contactPhone : Text;
    status : Status;
    createdAt : Int;
    updatedAt : Int;
    price : Nat;
  };

  type ChatMessage = {
    id : Nat;
    fromAdmin : Bool;
    text : Text;
    timestamp : Int;
    customerPrincipal : Principal;
  };

  type CustomerChat = {
    customer : Principal;
    customerId : Text;
    messages : [ChatMessage];
  };

  type Result = {
    #ok : ();
    #err : Text;
  };

  type CustomerProfile = {
    principal : Principal;
    customerId : Text;
    registeredAt : Int;
  };

  type UserProfile = {
    name : Text;
    email : Text;
    phone : Text;
  };

  type PaymentStatusInfo = {
    orderId : Nat;
    status : Text;
    contactName : Text;
    customerId : Text;
    price : Nat;
    updatedAt : Int;
  };

  let orders = Map.empty<Nat, Order>();
  var nextOrderId = 0;

  let chatMessages = Map.empty<Principal, List.List<ChatMessage>>();
  var nextChatId = 0;

  // Customer profiles: principal -> CustomerProfile
  let customerProfiles = Map.empty<Principal, CustomerProfile>();
  var nextCustomerSeq = 1;

  // User profiles for frontend
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Payment approvals: orderId -> approved (keep for migration)
  let paymentApprovals = Map.empty<Nat, Bool>();

  // Payment status: orderId -> PaymentStatus (new)
  let paymentStatuses = Map.empty<Nat, PaymentStatus>();

  // Rejected payments: orderId -> Bool (separate map to avoid stable compat issues)
  let rejectedPayments = Map.empty<Nat, Bool>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Generate a short customer ID like PAID-0001
  func generateCustomerId(seq : Nat) : Text {
    let seqText = seq.toText();
    let padded = if (seq < 10) { "000" # seqText }
    else if (seq < 100) { "00" # seqText }
    else if (seq < 1000) { "0" # seqText }
    else { seqText };
    "PAID-" # padded;
  };

  // Self-register as a user - any caller can call this (idempotent)
  public shared ({ caller }) func selfRegister() : async Text {
    switch (customerProfiles.get(caller)) {
      case (?profile) { profile.customerId };
      case null {
        let seq = nextCustomerSeq;
        nextCustomerSeq += 1;
        let customerId = generateCustomerId(seq);
        let profile : CustomerProfile = {
          principal = caller;
          customerId;
          registeredAt = Time.now();
        };
        customerProfiles.add(caller, profile);
        customerId;
      };
    };
  };

  public query ({ caller }) func getMyProfile() : async ?CustomerProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their profile");
    };
    customerProfiles.get(caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func submitOrder(
    videoFileId : Text,
    videoFileName : Text,
    description : Text,
    contactName : Text,
    contactEmail : Text,
    contactPhone : Text,
  ) : async Nat {
    // Auto-register if not already registered
    if (customerProfiles.get(caller) == null) {
      let seq = nextCustomerSeq;
      nextCustomerSeq += 1;
      let customerId = generateCustomerId(seq);
      customerProfiles.add(caller, {
        principal = caller;
        customerId;
        registeredAt = Time.now();
      });
    };
    let orderId = nextOrderId;
    let now = Time.now();

    let order : Order = {
      id = orderId;
      userId = caller;
      videoFileId;
      videoFileName;
      description;
      contactName;
      contactEmail;
      contactPhone;
      status = #Pending;
      createdAt = now;
      updatedAt = now;
      price = 100;
    };

    orders.add(orderId, order);
    paymentStatuses.add(orderId, #Pending); // new: set initial payment status
    nextOrderId += 1;
    orderId;
  };

  public query ({ caller }) func getMyOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their orders");
    };
    let myOrders = List.empty<Order>();
    for (order in orders.values()) {
      if (order.userId == caller) {
        myOrders.add(order);
      };
    };
    myOrders.toArray();
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    orders.values().toArray();
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Nat, status : Status) : async Result {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };

    switch (orders.get(orderId)) {
      case (null) {
        #err("Order not found");
      };
      case (?order) {
        let updatedOrder = {
          id = order.id;
          userId = order.userId;
          videoFileId = order.videoFileId;
          videoFileName = order.videoFileName;
          description = order.description;
          contactName = order.contactName;
          contactEmail = order.contactEmail;
          contactPhone = order.contactPhone;
          status;
          createdAt = order.createdAt;
          updatedAt = Time.now();
          price = order.price;
        };
        orders.add(orderId, updatedOrder);
        #ok(());
      };
    };
  };

  public query ({ caller }) func getOrder(orderId : Nat) : async ?Order {
    switch (orders.get(orderId)) {
      case (null) { null };
      case (?order) {
        if (order.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own orders");
        };
        ?order;
      };
    };
  };

  public query ({ caller }) func getOrderStats() : async {
    total : Nat;
    pending : Nat;
    inProgress : Nat;
    completed : Nat;
  } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view order stats");
    };

    var pending = 0;
    var inProgress = 0;
    var completed = 0;

    for (order in orders.values()) {
      switch (order.status) {
        case (#Pending) { pending += 1 };
        case (#InProgress) { inProgress += 1 };
        case (#Completed) { completed += 1 };
        case (#Cancelled) {};
      };
    };

    {
      total = orders.size();
      pending;
      inProgress;
      completed;
    };
  };

  public shared ({ caller }) func sendCustomerMessage(text : Text) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };
    // Auto-register if not already registered
    let msg : ChatMessage = {
      id = nextChatId;
      fromAdmin = false;
      text;
      timestamp = Time.now();
      customerPrincipal = caller;
    };
    nextChatId += 1;
    let existing = switch (chatMessages.get(caller)) {
      case (?list) { list };
      case null { List.empty<ChatMessage>() };
    };
    existing.add(msg);
    chatMessages.add(caller, existing);
    #ok(());
  };

  public shared ({ caller }) func sendAdminReply(customerPrincipal : Principal, text : Text) : async Result {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can send replies");
    };
    let msg : ChatMessage = {
      id = nextChatId;
      fromAdmin = true;
      text;
      timestamp = Time.now();
      customerPrincipal;
    };
    nextChatId += 1;
    let existing = switch (chatMessages.get(customerPrincipal)) {
      case (?list) { list };
      case null { List.empty<ChatMessage>() };
    };
    existing.add(msg);
    chatMessages.add(customerPrincipal, existing);
    #ok(());
  };

  public query ({ caller }) func getMyChat() : async [ChatMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their chat");
    };
    switch (chatMessages.get(caller)) {
      case (?list) { list.toArray() };
      case null { [] };
    };
  };

  public query ({ caller }) func getAllChats() : async [CustomerChat] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all chats");
    };
    let result = List.empty<CustomerChat>();
    for ((principal, msgs) in chatMessages.entries()) {
      let customerId = switch (customerProfiles.get(principal)) {
        case (?p) { p.customerId };
        case null { principal.toText() };
      };
      result.add({ customer = principal; customerId; messages = msgs.toArray() });
    };
    result.toArray();
  };

  public query ({ caller }) func getAllCustomers() : async [CustomerProfile] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view customers");
    };
    let result = List.empty<CustomerProfile>();
    for (profile in customerProfiles.values()) {
      result.add(profile);
    };
    result.toArray();
  };

  public shared ({ caller }) func approvePayment(orderId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can approve payments");
    };
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?_) {
        paymentApprovals.add(orderId, true); // keep for compatibility
        paymentStatuses.add(orderId, #Approved);
      };
    };
  };

  public query ({ caller }) func isPaymentApproved(orderId : Nat) : async Bool {
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        if (order.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only check your own orders");
        };
        paymentStatuses.get(orderId) == ?#Approved;
      };
    };
  };

  public shared ({ caller }) func setPaymentProcessing(orderId : Nat) : async () {
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        if (order.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own orders");
        };
        paymentStatuses.add(orderId, #Processing);
      };
    };
  };

  public shared ({ caller }) func cancelPayment(orderId : Nat) : async () {
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        if (order.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only cancel your own orders");
        };
        paymentStatuses.add(orderId, #Cancelled);
      };
    };
  };


  public shared ({ caller }) func rejectPayment(orderId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can reject payments");
    };
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?_) {
        rejectedPayments.add(orderId, true);
        paymentStatuses.add(orderId, #Cancelled);
      };
    };
  };
  public query ({ caller }) func getPaymentStatus(orderId : Nat) : async PaymentStatus {
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        if (order.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own orders");
        };
        switch (paymentStatuses.get(orderId)) {
          case (null) { #Pending };
          case (?status) { status };
        };
      };
    };
  };

  public query ({ caller }) func getAllPaymentStatuses() : async [PaymentStatusInfo] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all payment statuses");
    };

    let results = List.empty<PaymentStatusInfo>();

    for ((orderId, status) in paymentStatuses.entries()) {
      switch (orders.get(orderId)) {
        case (?order) {
          let customerId = switch (customerProfiles.get(order.userId)) {
            case (?p) { p.customerId };
            case null { order.userId.toText() };
          };
          let statusText : Text = switch (rejectedPayments.get(orderId)) {
            case (?true) { "Rejected" };
            case _ {
              switch (status) {
                case (#Approved) { "Approved" };
                case (#Processing) { "Processing" };
                case (#Cancelled) { "Cancelled" };
                case (#Pending) { "Pending" };
              };
            };
          };
          results.add({
            orderId;
            status = statusText;
            contactName = order.contactName;
            customerId;
            price = order.price;
            updatedAt = order.updatedAt;
          });
        };
        case null {};
      };
    };

    results.toArray();
  };
};
