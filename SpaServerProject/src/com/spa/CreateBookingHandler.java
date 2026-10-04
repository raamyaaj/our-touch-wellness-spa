package com.spa;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.*;
import java.sql.*;
import java.util.Map;

public class CreateBookingHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            String jsonResponse = "";
            
            try {
                String formData = ServerUtils.getFormData(exchange);
                Map<String, String> inputs = ServerUtils.parseFormData(formData);
                
                String username = inputs.get("username");
                String date = inputs.get("date");
                String service = inputs.get("service");
                String promo = inputs.get("promo");

                try (Connection conn = DriverManager.getConnection(SpaServer.DB_URL, SpaServer.DB_USER, SpaServer.DB_PASS)) {
                    // 1. KUKWENTAHIN NG JAVA ANG PRESYO BASE SA SERVICE AT PROMO MO
                    int basePrice = 500; // Backup price kung sakaling mag-error
                    
                    // Alamin ang orihinal na presyo mula sa services table
                    String priceSql = "SELECT price FROM services WHERE service_name = ?";
                    PreparedStatement pricePs = conn.prepareStatement(priceSql);
                    pricePs.setString(1, service);
                    ResultSet priceRs = pricePs.executeQuery();
                    if (priceRs.next()) {
                        basePrice = priceRs.getInt("price");
                    }
                    
                    // Ilapat ang promo discount calculation logic mula sa code blueprint mo
                    int finalPrice = basePrice;
                    if ("Couple Package Disc.".equals(promo)) {
                        finalPrice = 1200; // Fixed packet rate para sa dalawa base sa JS mo
                    } else if ("Early Bird (1PM - 5PM)".equals(promo)) {
                        finalPrice -= 50;  // Bawas ₱50 sa regular rate
                    }

                    // 2. I-SAVE ANG BOOKING SA MYSQL DATABASE
                    String sql = "INSERT INTO bookings (customer_username, appointment_date, service_name, promo_applied, status) VALUES (?, ?, ?, ?, 'Active')";
                    PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
                    ps.setString(1, username);
                    ps.setString(2, date);
                    ps.setString(3, service);
                    ps.setString(4, promo);
                    ps.executeUpdate();
                    
                    // Kuhanin ang naging Booking ID (Auto-increment Generated Key)
                    int bookingId = 0;
                    try (ResultSet generatedKeys = ps.getGeneratedKeys()) {
                        if (generatedKeys.next()) {
                            bookingId = generatedKeys.getInt(1);
                        }
                    }
                 // Isabit sa loob ng SUCCESS CUSTOMER BOOKING block:
                    ServerUtils.logActivity("Customer '" + username + "' booked an appointment for " + service + " on " + date);

                    // 3. MAGPADALA NG DYNAMIC RECEIPT DATA BACK TO JAVASCRIPT
                    jsonResponse = String.format(
                        "{\"status\":\"success\",\"id\":\"#%03d\",\"name\":\"%s\",\"date\":\"%s\",\"service\":\"%s\",\"promo\":\"%s\",\"total\":\"₱%s\"}",
                        bookingId, username, date, service, promo, String.format("%,d", finalPrice)
                    );
                }
            } catch (Exception e) {
                jsonResponse = "{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}";
            }
            
            ServerUtils.sendJSONResponse(exchange, jsonResponse);
        }
    }
}
