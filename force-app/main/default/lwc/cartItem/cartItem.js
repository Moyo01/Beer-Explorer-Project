import { api, LightningElement } from 'lwc';

export default class CartItem extends LightningElement {

@api item;

    handleDelete(event){
        const deleteEvent = new CustomEvent('delete', {
            detail: this.item.Id
        });
        this.dispatchEvent(deleteEvent);
    }
}