import { LightningElement, track, wire } from 'lwc';
import orderDetails from '@salesforce/apex/beerController.orderDetails'
import {CurrentPageReference, NavigationMixin } from 'lightning/navigation';

export default class OrderDetail extends NavigationMixin(LightningElement) {

    @track orderId
   @track orderInfo;
   @track orderItems;

   @wire(CurrentPageReference)
   setPageRef(CurrentPageReference){
       this.orderId = CurrentPageReference.state.c__orderId;
   }

   connectedCallback() {
    //code to fetch order details
    this.getorderDetails();
   }

   getorderDetails(){
       orderDetails({orderId: this.orderId})
       
       .then(result => {
          this.orderInfo = result.order;
          this.orderItems = result.orderitems;
   })
        .catch(error => {
            console.log(error);
        })
   }

}