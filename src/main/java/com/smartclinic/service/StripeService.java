package com.smartclinic.service;

import com.smartclinic.model.Appointment;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
public class StripeService {

        @Value("${stripe.api.key}")
        private String secretKey;

        @Value("${app.base-url:http://localhost:8081}")
        private String baseUrl;

        @PostConstruct
        public void init() {
                Stripe.apiKey = secretKey;
        }

        public boolean isPlaceholderKey() {
                return secretKey == null || secretKey.contains("your_secret_key");
        }

        public String createCheckoutSession(Appointment appointment) throws StripeException {
                // Stripe amounts are in cents
                long amountInCents = appointment.getPaymentAmount().multiply(new java.math.BigDecimal(100)).longValue();

                SessionCreateParams params = SessionCreateParams.builder()
                                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                                .setMode(SessionCreateParams.Mode.PAYMENT)
                                .setSuccessUrl(baseUrl + "/payment/success?appointmentId="
                                                + appointment.getId())
                                .setCancelUrl(baseUrl + "/payment/cancel?appointmentId="
                                                + appointment.getId())
                                .addLineItem(SessionCreateParams.LineItem.builder()
                                                .setQuantity(1L)
                                                .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                                                .setCurrency("lkr")
                                                                .setUnitAmount(amountInCents)
                                                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData
                                                                                .builder()
                                                                                .setName("Medical Consultation - Appointment #"
                                                                                                + appointment.getId())
                                                                                .build())
                                                                .build())
                                                .build())
                                .build();

                Session session = Session.create(params);
                return session.getUrl();
        }
}
