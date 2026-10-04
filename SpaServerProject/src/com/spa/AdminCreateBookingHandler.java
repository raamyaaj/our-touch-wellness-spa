package com.spa;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.*;
import java.sql.*;
import java.util.Map;

public class AdminCreateBookingHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            String jsonResponse = "";
            try {
                String formData = ServerUtils.getFormData(exchange);
                Map<String, String> inputs = ServerUtils.parseFormData(formData);
                
                // Siguraduhing may safety checks kung sakaling blangko ang makuha
                String customerName = inputs.get("customerName") != null ? inputs.get("customerName").trim() : "Walk-in Client";
                String appointmentDate = inputs.get("appointmentDate") != null ? inputs.get("appointmentDate") : "2026-10-01";
                String serviceType = inputs.get("serviceType") != null ? inputs.get("serviceType") : "Traditional Hilot";
                String promoType = inputs.get("promoType") != null ? inputs.get("promoType") : "Regular Rate";

                // Diretsong koneksyon sa standalone database mo gamit ang SpaServer parameters
                try (Connection conn = DriverManager.getConnection(SpaServer.DB_URL, SpaServer.DB_USER, SpaServer.DB_PASS)) {
                    String sql = "INSERT INTO bookings (customer_username, appointment_date, service_name, promo_applied, status) VALUES (?, ?, ?, ?, 'Active')";
                    PreparedStatement ps = conn.prepareStatement(sql);
                    ps.setString(1, customerName);
                    ps.setString(2, appointmentDate);
                    ps.setString(3, serviceType);
                    ps.setString(4, promoType);
                    ps.executeUpdate();
                    
                    jsonResponse = "{\"status\":\"success\"}";
                }
            } catch (Exception e) {
                // Ipapasa ang exact error message pabalik sa JavaScript console para madali nating mahuli
                jsonResponse = "{\"status\":\"error\",\"message\":\"" + e.getMessage().replace("\"", "\\\"") + "\"}";
            }
            ServerUtils.sendJSONResponse(exchange, jsonResponse);
        }
    }
}
