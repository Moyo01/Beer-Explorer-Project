import { LightningElement, track, wire } from 'lwc';
import {CurrentPageReference, NavigationMixin } from 'lightning/navigation';
import getItems from '@salesforce/apex/beerController.getItems';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import couponInfo from '@salesforce/apex/beerController.couponInfo';
import saveAddress from '@salesforce/apex/beerController.saveAddress';
import addressDetails from '@salesforce/apex/beerController.addressDetails';
import createOrder  from  '@salesforce/apex/beerController.createOrder';

export default class CartDetail extends NavigationMixin(LightningElement) {

    @track cartid;
    @track Items;
    @track totalItems;
    @track error;
    @track totalAmount = 0.00;
    @track iscoupon = false;
    @track couponName;
    @track couponValue = 0;
    @track isProceed = false;
    @track totalAddress = false;
    @track addressId;
    @track addresses;
    @track selectedAddress; 
    

    @track addr = {
        City__c : '',
        Country__c : '',
        Postal_Code__c : '',
        State__c : '',
        Street__c : ''
    };

    handleChangeCoupon(event){
        this.couponName = event.target.value;
    }

    handleApplyCoupon(){
        if(!this.couponName){
            const event = new ShowToastEvent({
                title: 'Error',
                message: 'Please Enter Coupon Name',
                variant: 'error'
            });
            this.dispatchEvent(event);
        }
        if(this.couponName){
            couponInfo({name: this.couponName})
            .then(result => {
                console.log('Coupon result', result);
                this.couponValue = result.Price__c;
                this.totalAmount= this.totalAmount - this.couponValue;
            })
            .catch(error => {
                this.totalAmount = this.totalAmount + this.couponValue;
                this.couponValue = 0;
            });
        }
    }

    handleAddressSelect(event){
        const selectAddressId = event.detail;
        this.addressId = selectAddressId;

        this.selectedAddress = this.addresses.find(address => address.Id === selectAddressId);
    }

    handleSaveAddress(){ 
        saveAddress({ addressDetails: JSON.stringify(this.addr) })
        .then(result => {
            if (result && result.Id) {
                if (this.addresses) {
                    this.addresses = [...this.addresses, result];
                } else {
                    this.addresses = [result];
                }
    
                this.totalAddress = true; // ✅ move it here
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Address Saved',
                        variant: 'success'
                    })
                );
            } else {
                throw new Error('No ID returned in result');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.error = error;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Address Not Saved',
                    variant: 'error'
                })
            );
        });
    }
    

    placeOrder() {
        createOrder({ cartId: this.cartid, addressId: this.selectedAddress.Id, totalAmount: this.totalAmount })
            .then(result => {
                console.log('Order placed successfully', result);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Your Order has been successfully placed. Your Order no is ' + result.Name,
                        variant: 'success'
                    })
                );

                this[NavigationMixin.Navigate]({
                    type: 'standard__navItemPage',
                    attributes: {
                        actionName: 'view',
                        apiName:'Order_Detail'
                    },
                    state : {
                        c__orderId: result.Id
                    }
                }, true);
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Order not placed',
                        variant: 'error'
                    })
                );
                console.error('Order placement failed', error);
            });
    }
    

    handleAddNewAddress(){
        this.totalAddress = false;
    
    }

    handleInputChange(event){
        const name = event.target.name;
        const value = event.target.value;
        this.addr[name] = value;
    }

    getAddressDetails(){
        addressDetails()
        .then(result => {
            this.addresses = result;
            this.totalAddress = result && result.length > 0 ;
        })
        .catch(error => {
            console.log('error', error);
        });
   
    }



    @wire(CurrentPageReference)
    setPageRef(CurrentPageReference){
        this.cartid = CurrentPageReference.state.c__cartId;
    }

    handleProceed(){
        this.isProceed =true
    }


    connectedCallback() {
       this.cartItems();
       this.getAddressDetails();
    }

    cartItems(){
        getItems({cartId: this.cartid})
        .then(result => {
            this.Items = JSON.parse(result);
            this.totalItems = this.Items.length;
            this.error = undefined;
           // console.log('result', result);

            for(let i = 0 ; i < this.Items.length ;i++){
                if(this.Items[i]){
                    this.totalAmount = this.totalAmount + this.Items[i].Total_Amount__c;
                }
            }
    })
    .catch(error => {
        this.error = error;
        this.cartItems = undefined;
        console.log('error', error);
    });
}

handleContinue(){
    this[NavigationMixin.Navigate]({
        type: 'standard__navItemPage',
        attributes: {
            apiName: 'Beer_Explorer',
            state : {
                c__cartId: this.cartid
            }
        },
    });
}


async deleteCartItem(event) {
    const selectedRecordId = event.detail; 
    // Find the item by ID
    const selectedItem = this.Items.find(item => item.Id === selectedRecordId);
    // Get the index of the item
    const indexItem = this.Items.indexOf(selectedItem);
    
    try { 
        await deleteRecord(selectedRecordId);
        // Remove from local array
        this.Items.splice(indexItem, 1);
        
        // Update totals
        this.totalItems = this.Items.length;
        this.totalAmount = this.totalAmount - selectedItem.Total_Amount__c;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Cart Item Deleted',
                variant: 'success'
            })
        );
        
        // Since you're manually updating the UI, you probably don't need refreshApex here
        // If you want to refresh data from server:
       
    }
    catch(error) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: error.body.message,
                variant: 'error'
            })
        );
    }
}
   
handleCoupon(){
    this.iscoupon = true;
}
}