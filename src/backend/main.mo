import Array "mo:core/Array";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Time "mo:core/Time";
import List "mo:core/List";
import Principal "mo:core/Principal";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

actor {
  type Status = { #Pending; #InProgress; #Completed; #Cancelled };

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

  type Result = {
    #ok : ();
    #err : Text;
  };

  module OrderCompare {
    public func compare(order1 : Order, order2 : Order) : Order.Order {
      Nat.compare(order1.id, order2.id);
    };
  };

  let orders = Map.empty<Nat, Order>();
  var nextOrderId = 0;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public shared ({ caller }) func submitOrder(
    videoFileId : Text,
    videoFileName : Text,
    description : Text,
    contactName : Text,
    contactEmail : Text,
    contactPhone : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit orders");
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
    myOrders.toArray().sort();
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    orders.values().toArray().sort();
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
      case (null) {
        null;
      };
      case (?order) {
        if (caller != order.userId and not AccessControl.isAdmin(accessControlState, caller)) {
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
};
