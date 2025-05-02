import { LightningElement, wire, track } from 'lwc';
import getBeerList from '@salesforce/apex/beerController.getBeerList';
import getCartId from '@salesforce/apex/beerController.getCartId';
import cartIcon from '@salesforce/resourceUrl/cart';
import createCartItem from '@salesforce/apex/beerController.createCartItem';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';

export default class BeerList extends NavigationMixin(LightningElement) {
    
    @track beerRecords;
    @track errors;
    @track cartId;
    @track cart = cartIcon;
    @track itemsInCart = 0;
    
    connectedCallback(){
        this.defaultCartId();
    }

    defaultCartId(){
        getCartId()
        .then(data => {
            console.log('result', data);
            const wrapper = JSON.parse(data);
            if(wrapper){
                this.itemsInCart = wrapper.Count;
                this.cartId = wrapper.CartId;
            }
        })
        .catch(error => {
            this.cartId = undefined;
            console.log('error', error);
        })
    }

    addToCart(event) {
        const beerId = event.detail;
        console.log('beerId', beerId);
    
        const selectedBeerRecord = this.beerRecords.find(record => record.Id === beerId);
        console.log('selectedBeerRecord', selectedBeerRecord);
    
        console.log('cartId value:', this.cartId);
        console.log('beerId value:', beerId);
        console.log('Price value:', selectedBeerRecord.Price__c);

        createCartItem({
            cartId: this.cartId, 
            beerId: beerId, 
            Amount: selectedBeerRecord.Price__c
        })
        .then(data => {   
            console.log('cart Item Id', data);
            this.itemsInCart = this.itemsInCart + 1;
            const event = new ShowToastEvent({
                title: 'Success',
                message:
                selectedBeerRecord.Name + ' Added Into Cart',
                variant: 'success'
            });
            this.dispatchEvent(event);
        })
        .catch(error => {
            console.log('error', error);
            const event = new ShowToastEvent({
                title: 'Error',
                message:
                  JSON.stringify(error),
                variant: 'error'
            });
            this.dispatchEvent(event);
        });
    }

    @wire(getBeerList)
    wiredBeers({data, error}){
        this.beerRecords = data;
        this.errors = error;
    }

    handleSearch(event){
        const searchVal = event.detail;

        getBeerList({searchKey: searchVal})
        .then(result => {
            console.log('result', result);
            this.beerRecords = result;
            this.errors = undefined;
        })
        .catch(error => {
            this.errors = error;
            this.beerRecords = undefined;
        })
    }

    navigateToCartDetail(){
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
                // recordId: this.cartId,
               // objectApiName: 'cart_detail',
                actionName: 'view',
                apiName:'cart_detail'
            },
            state : {
                c__cartId: this.cartId
            }
        });
}
}
