package com.spa;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.*;
import java.sql.*;
import java.util.Map;

public class AdminServicesCRUDHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String jsonResponse = "";
        
        if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            try {
                String formData = ServerUtils.getFormData(exchange);
                Map<String, String> inputs = ServerUtils.parseFormData(formData);
                
                String idStr = inputs.get("serviceId");
                String name = inputs.get("serviceName") != null ? inputs.get("serviceName").trim() : "";
                String priceStr = inputs.get("servicePrice") != null ? inputs.get("servicePrice").trim() : "0";
                String desc = inputs.get("serviceDesc") != null ? inputs.get("serviceDesc").trim() : "";
                
                int price = Integer.parseInt(priceStr);
                
                // 🚀 MATATAG NA PAGSURI: Alamin kung may valid ID number para sa UPDATE
                int id = 0;
                if (idStr != null && !idStr.trim().isEmpty()) {
                    try {
                        id = Integer.parseInt(idStr.trim());
                    } catch (NumberFormatException nfe) {
                        id = 0; // Kung hindi numero, ituring na Add/Insert operation
                    }
                }

                if (name.isEmpty() || price <= 0) {
                    jsonResponse = "{\"status\":\"error\",\"message\":\"Mangyaring punan ang pangalan at tamang presyo.\"}";
                } else {
                    try (Connection conn = DriverManager.getConnection(SpaServer.DB_URL, SpaServer.DB_USER, SpaServer.DB_PASS)) {
                        
                        // 🚀 SOLID LOGIC CRITERIA: Kung ang ID ay higit sa 0, sigurado itong UPDATE operation!
                        if (id > 0) {
                            String sql = "UPDATE services SET service_name = ?, price = ?, description = ? WHERE service_id = ?";
                            PreparedStatement ps = conn.prepareStatement(sql);
                            ps.setString(1, name);
                            ps.setInt(2, price);
                            ps.setString(3, desc);
                            ps.setInt(4, id);
                            ps.executeUpdate();
                            
                            // 🚀 INALAGAY DITO: Isabit sa dulo ng SUCCESS UPDATE block ng admin:
                            ServerUtils.logActivity("Admin modified spa menu service properties for package: " + name);
                            
                        } else {
                            // Kung ang ID ay 0 o blangko, sigurado itong bagong INSERT/ADD operation
                            String sql = "INSERT INTO services (service_name, price, description, duration_minutes, status) VALUES (?, ?, ?, 60, 'Active')";
                            PreparedStatement ps = conn.prepareStatement(sql);
                            ps.setString(1, name);
                            ps.setInt(2, price);
                            ps.setString(3, desc);
                            ps.executeUpdate();
                            
                            // 🚀 INALAGAY DITO: Isabit sa dulo ng SUCCESS INSERT block ng admin:
                            ServerUtils.logActivity("Admin listed a new spa service package to menu portfolio: " + name);
                        }
                        
                        jsonResponse = "{\"status\":\"success\"}";
                    }
                }
            } catch (Exception e) {
                jsonResponse = "{\"status\":\"error\",\"message\":\"" + e.getMessage().replace("\"", "\\\"") + "\"}";
            }
            ServerUtils.sendJSONResponse(exchange, jsonResponse);
        }
    }
}
