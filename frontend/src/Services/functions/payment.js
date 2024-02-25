import { toast } from "react-hot-toast"

// import rzpLogo from "../../assets/rzp_logo.svg"

import { apiConnector } from '../apiconnector1'
import {paymentEndpoints}  from "../endpoints"

const {PAYMENT_API,VERIFY_API, SEND_PAYMENT_SUCCESS_EMAIL_API} = paymentEndpoints;

function loadScript(src) {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;

        script.onload = () => {
            resolve(true);
        }
        script.onerror= () =>{
            resolve(false);
        }
        document.body.appendChild(script);
    })
}

//items(NUMBER) is amount of the product
export async function BookProduct(token, items, userDetails, navigate,productId) {
    const toastId = toast.loading("Loading...");
    try{
    
        //load the script
        const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");

        if(!res) {
           
            toast.error("RazorPay SDK failed to load");
            return;
        }

        //initiate the order
        const orderResponse = await apiConnector("POST", PAYMENT_API, 
                                {items,token},
                                {
                                    Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1ZGEyN2M1ZDEyMzQ4OWEyMDM1MzhmMyIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTcwODg0NzMwNSwiZXhwIjoxNzA4OTMzNzA1fQ.mCauOFoZSkjMay8dF5t7Yhx2GdoLNabEzz7jHnplfyQ`,
                                })

        if(!orderResponse.data.success) {
            throw new Error(orderResponse.data.message);
        }
        console.log("PRINTING orderResponse", orderResponse.data);
        //options
        const options = {
            key: '',
            currency: orderResponse.data.order.currency,
            amount: `${orderResponse.data.order.amount}`,
            order_id:orderResponse.data.order.id,
            name:"MarketPlace",
            description: "Thank You for Purchasing the Food",
            // image:rzpLogo,
            prefill: {
                name:`${userDetails.name}`,
                email:userDetails.email
            },
            handler: function(response) {
              
                //send successful wala mail
                // sendPaymentSuccessEmail( {...response, items}, orderResponse.data.message.amount,token );
                //verifyPayment
                verifyPayment({...response, items,productId}, token, navigate);
            }
        }
        //miss hogya tha 
        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
        paymentObject.on("payment.failed", function(response) {
            toast.error("oops, payment failed");
            console.log(response.error);
        })

    }
    catch(error) {
        console.log("PAYMENT API ERROR.....", error);
        toast.error("Could not make Payment");
    }
    toast.dismiss(toastId);
}

async function sendPaymentSuccessEmail(response, amount, token) {
    try{
      console.log("sendPaymentSuccessEmail r :",response)
        await apiConnector("POST", SEND_PAYMENT_SUCCESS_EMAIL_API, {
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            amount,
        },{
            Authorization: `Bearer ${token}`
        })
    }
    catch(error) {
        console.log("PAYMENT SUCCESS EMAIL ERROR....", error);
    }
}

//verify payment
async function verifyPayment(bodyData, token, navigate) {
    const toastId = toast.loading("Verifying Payment....");
    // dispatch(setPaymentLoading(true));
    try{
        const response  = await apiConnector("POST", VERIFY_API, bodyData, {
            Authorization:`Bearer ${token}`,
        })

        if(!response.data.success) {
            throw new Error(response.data.message);
        }
        toast.success("payment Successful, ypou are addded to the food");
        navigate("/");
    
    }   
    catch(error) {
        console.log("PAYMENT VERIFY ERROR....", error);
        toast.error("Could not verify Payment");
    }
    toast.dismiss(toastId);
    // dispatch(setPaymentLoading(false));
}