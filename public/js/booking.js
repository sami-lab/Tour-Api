//set tour id on button data attribute if user is login else redirect to login page
//Add Script of Stripe on UI
 
//On click of buy btn add a click listener and then read tour id using e.target.dataset
//then call this function of book tour 
import axios from 'axios';

//this object will come from script we should add on ui
const stripe= Stripe('pk_test_Vb6BNLCS6qrJZHfTrs43B1dJ00oLILWBK0')

exports.bookTour= async tourId=>{
    try{
        //1 Get checkout session from APi
         //tourId should be passed from UI
         const session  = await axios(`http://127.0.01:3000/api/v1/booking/checkout-session/${tourId}`)
         //2 create checkout form + charge cridit card
         await stripe.redirectToCheckout({
             sessionId : session.data.session.id
         })
    }
    catch(err){
        console.log(err);
        alert(err)
    }
}