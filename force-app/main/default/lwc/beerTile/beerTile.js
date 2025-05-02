import { api, LightningElement } from 'lwc';

export default class BeerTile extends LightningElement {
    @api beerRecords; 

    handleAddToCart(){
        const addToCart = new CustomEvent('cart', {
            detail: this.beerRecords.Id
        });
        this.dispatchEvent(addToCart);
    }
}