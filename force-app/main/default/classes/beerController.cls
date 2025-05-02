public with sharing class beerController {
   
    @AuraEnabled(cacheable=true)
    public static List<sObject> getBeerList(String searchKey){
        String likeparam = '%' + searchKey + '%';
        String query = '';
        List<sObject> beers;
    
        if (searchKey != null) {
            query = 'SELECT Id, Name, Alcohol__c, Id__c, Price__c, brewery_Name__c, Image__c, Remaining_Quantity__c, Total_Quantity__c ' +
                    'FROM Beer__c WHERE Name LIKE :likeparam LIMIT 50';
        } else {
            query = 'SELECT Id, Name, Alcohol__c,brewery_id__c, Price__c, brewery_Name__c, Image__c, Remaining_Quantity__c, Total_Quantity__c ' +
                    'FROM Beer__c LIMIT 50';
        }
    
        try {
            beers = Database.query(query);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
        return beers;
    }
    

    public static String generateCardId(){
        String CharList = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
        Integer position;
        Integer LengthRequired = 30;
        String Res = '';
        for(Integer i = 0; i <= LengthRequired; i++) {
            position = Integer.valueof(String.valueof(Math.roundToLong(CharList.length()*Math.random()))) -1;
            Res += CharList.substring(position,position+1);
        }
        return Res;
    }
/*

          @AuraEnabled(cacheable=true)
public static String getCouponInformation(String name) {
    Coupon__c coupon; // Declare outside so it's accessible after try-catch
    try {
        coupon = [SELECT Id, Name, Price__c FROM Coupon__c WHERE Name = :name LIMIT 1];
    } catch (Exception e) {
        throw new AuraHandledException(e.getMessage());
    }
    return coupon.Id;
}
*/
  

@AuraEnabled(cacheable=false)
public static String getCartId() {
    try {
        List<Cart__c> cartInfo = [
            SELECT Id, Name 
            FROM Cart__c 
            WHERE User__c = :UserInfo.getUserId() 
              AND Cart_Status__c = 'open' 
              AND Is_Active__c = true
        ];

        if (cartInfo != null && cartInfo.size() > 0) {
            List<Cart_Item__c> cartItems = new List<Cart_Item__c>();
            cartItems = [
                SELECT Id, Name, Beer__c, Cart__c, Item_Quantity__c, Item_Amount__c
                FROM Cart_Item__c
                WHERE Cart__c = :cartInfo.get(0).Id
            ];

            Decimal itemQnty = 0;
            for (Cart_Item__c item : cartItems) {
                itemQnty = itemQnty + item.Item_Quantity__c;
            }

            CartWrapper wrapper = new CartWrapper();
            wrapper.CartId = cartInfo.get(0).Id;
            wrapper.items = cartItems;
            wrapper.Count = itemQnty;

            return JSON.serialize(wrapper);

        } else {
            // FIX: couponId was used but 'coupon' referenced later
            Coupon__c coupon = getCouponInformation('default');

            String generatedId = generateCardId(); // okay to keep even if unused

            Cart__c newCart = new Cart__c(
                User__c = UserInfo.getUserId(),
                Is_Active__c = true,
                Cart_Status__c = 'Open',
                Coupon__c = coupon.Id, // FIXED: now matches correct variable
                Cart_Id__c = String.valueOf(Math.random())
            );
            insert newCart;

            CartWrapper wrapper = new CartWrapper();
            wrapper.CartId = newCart.Id;
            wrapper.items = null;
            wrapper.Count = 0;

            return JSON.serialize(wrapper);
        }

    } catch (Exception e) {
        throw new AuraHandledException(e.getMessage());
    }
}


public Static Map<Id, Cart_Item__c> getCartItems(String cartId){
    /* beerId, Cart_Iems*/
    Map<Id, Cart_Item__c> cartItemsMap = new Map<Id, Cart_Item__c>();
    for ( Cart_Item__c cart : [Select Id, Name, Beer__c, Cart__c, 
                            Item_Quantity__c, Item_Amount__c
                            FROM Cart_Item__c
                            Where Cart__c =: cartId]) {
        cartItemsMap.put(cart.Beer__c, cart);
    }
    return cartItemsMap;
}

@AuraEnabled
public static String createCartItem(String cartId, String beerId, Decimal Amount) {
    try {
        Cart_Item__c currentCart = new Cart_Item__c();
            Map<Id, Cart_Item__c> cartItemsMap = getCartItems(CartId);
            if(cartItemsMap.containsKey(beerId)){
                currentCart = cartItemsMap.get(beerId);
                currentCart.Item_Amount__c = currentCart.Item_Amount__c + Amount;
                currentCart.Item_Quantity__c = currentCart.Item_Quantity__c + 1;
                update currentCart;
            }else {
                currentCart.Cart__c = cartId;
                currentCart.Beer__c = beerId;
                currentCart.Item_Amount__c = Amount;
                currentCart.Item_Quantity__c = 1 ; // Changed to match your query field name
            }
        insert currentCart;
        return currentCart.Id;
    } catch(Exception e) {
        System.debug('Error creating cart item: ' + e.getMessage());
        throw new AuraHandledException('Error creating cart item: ' + e.getMessage());
    }
}

Public class orderWrapper{
    @AuraEnabled
    public Order__c order   {get;set;}
    @AuraEnabled
    public List<Order_Item__c> orderitems     {get; set;}

}


public class CartWrapper {
    @AuraEnabled
    public String CartId                { get; set; }
    @AuraEnabled
    public Decimal Count                { get; set; }
    @AuraEnabled
    public List<Cart_Item__c> items     { get; set; }
}

@AuraEnabled
    public static Coupon__c couponInfo(String name){
        Coupon__c Coupon = getCouponInformation(name);
        return Coupon;
    }

    public static Coupon__c getCouponInformation(String name){
        Coupon__c couponRec = [Select Id, Name, 
                                Price__c 
                                FROM Coupon__c 
                                Where Expired__c = false
                                AND (Remaining_Quantity__c > 0 OR Name ='Default')
                                AND Name =: name];
        return couponRec;
    }

    @AuraEnabled
    public static Address_Book__c saveAddress(string addressDetails ){
        try {
            Address_Book__c addressInfo = (Address_Book__c)JSON.deserialize(addressDetails,
                                                        Address_Book__c.class);
        addressInfo.User__c = UserInfo.getUserId();
        insert addressInfo;
        return addressInfo;
            
        } catch (Exception e) {
            System.debug('Error during saveAddress: ' + e.getMessage());
            throw new AuraHandledException('Save failed: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static Address_Book__c addressDetails(){
        try {
                          List<Address_Book__c> addInfo = ([SELECT Id, City__c, Country__c, 
         Postal_Code__c, State__c, 
         Street__c, User__c 
         FROM Address_Book__c
     Where User__c != null 
     AND User__c =: UserInfo.getUserId()]);

            If(!addInfo.IsEmpty()){
                return addInfo[0];
            } else {
                return null;
            }
            
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
public static orderWrapper orderDetails(String orderId) {
    try {
        List<Order__c> orderInfo = [
            SELECT Id, Name, User__c, Shipping_Address__c, subTotal__c,
                Shipping_Address__r.Street__c, Shipping_Address__r.City__c, 
                Shipping_Address__r.State__c, Shipping_Address__r.Country__c, 
                Shipping_Address__r.Postal_Code__c,
                (SELECT Id, Name, Beer__c, Beer__r.Name, Ordered_Quantity__c, Item_Price__c FROM Order_Items__r)
            FROM Order__c
            WHERE Id = :orderId AND User__c = :UserInfo.getUserId()
        ];
        if (!orderInfo.isEmpty()) {
            Order__c order = orderInfo[0];
            orderWrapper orderWrap = new orderWrapper();
            orderWrap.order = order;
            orderWrap.orderitems = order.Order_Items__r;
            return orderWrap;
        } else {
            throw new AuraHandledException('Order not found or access denied.');
        }
    } catch (Exception e) {
        throw new AuraHandledException(e.getMessage());
    }
}

    @AuraEnabled
    public static Order__c createOrder(String cartId, String addressId, Decimal totalAmount) {
        try {
            Order__c newOrder = new Order__c(
                Cart__c = cartId,
                Shipping_Address__c = addressId,
                subTotal__c = totalAmount,
                User__c = UserInfo.getUserId()
            );
    
            insert newOrder;

            List<Cart_Item__c> CartItems = (List<Cart_Item__c>)JSON.deserialize(getItems(cartId),
                                                    List<Cart_Item__c>.class);

             // to create an order item record for every cart item
            List<Order_Item__c> orderItem = new List<Order_Item__c>();
            for(Cart_Item__c CartIT : CartItems){
                Order_Item__c OItem = new Order_Item__c();
                OItem.Beer__c = CartIT.Beer__c;
                OItem.Item_Price__c = CartIT.Item_Amount__c;
                OItem.Ordered_Quantity__c = CartIT.Item_Quantity__c;
                OItem.Related_Order__c = newOrder.Id;
                orderItem.add(OItem);
            }
            Insert orderItem;

            Cart__c cart = new Cart__c();
            cart.Id = cartId;
            cart.Cart_Status__c = 'Closed';
            cart.Is_Active__c= false;
            update cart;


            Order__c order = [SELECT Id, Name FROM Order__c WHERE Id =: newOrder.Id];
            return order;
    
        } catch (Exception e) {
            throw new AuraHandledException('Failed to create order: ' + e.getMessage());
        }
    }
    
    

@AuraEnabled
public static String getItems(String cartId) {
    try {
        List<Cart_Item__c> cartItems = [
            SELECT Id, Name, Beer__c, Cart__c, Item_Quantity__c, Item_Amount__c, Total_Amount__c, Beer__r.Name
            FROM Cart_Item__c
            WHERE Cart__c = :cartId
        ];
          
            return JSON.serialize(cartItems);
    } catch (Exception e) {
        throw new AuraHandledException(e.getMessage());
    }
}



}
