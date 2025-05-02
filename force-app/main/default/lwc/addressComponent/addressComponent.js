import { LightningElement, api } from 'lwc';

export default class AddressComponent extends LightningElement {

    @api address;

    handleSelect(event){
        const addressEv = new CustomEvent('address',{
            detail : this.address.Id
        });
        this.dispatchEvent(addressEv);
    }
}