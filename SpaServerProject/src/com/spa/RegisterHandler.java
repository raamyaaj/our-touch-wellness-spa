package com.spa;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.*;
import java.sql.*;
import java.util.Map;

public class RegisterHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            String jsonResponse = "";
            try {
                String formData = ServerUtils.getFormData(exchange);
                Map<String, String> inputs = ServerUtils.parseFormData(formData);
                
                String user = inputs.get("username");
                String contact = inputs.get("contact");
                String pass = inputs.get("password");
                String confirmPass = inputs.get("confirmPassword");

                if (contact != null && contact.length() != 11) {
                    jsonResponse = "{\"status\":\"error\", \"message\":\"Ang Contact Number ay dapat eksaktong 11 digits.\"}";
                } else if (pass != null && !pass.equals(confirmPass)) {
                    jsonResponse = "{\"status\":\"error\", \"message\":\"Hindi nagtutugma ang Password at Confirm Password.\"}";
                } else {
                    try (Connection conn = DriverManager.getConnection(SpaServer.DB_URL, SpaServer.DB_USER, SpaServer.DB_PASS)) {
                        String sql = "INSERT INTO users (username, password, contact, role) VALUES (?, ?, ?, 'USER')";
                        PreparedStatement ps = conn.prepareStatement(sql);
                        ps.setString(1, user);
                        ps.setString(2, pass);
                        ps.setString(3, contact);
                        ps.executeUpdate();
                        
                        jsonResponse = "{\"status\":\"success\"}";
                    } catch (Exception e) {
                        jsonResponse = "{\"status\":\"error\", \"message\":\"Ang username ay maaaring nagamit na sa database.\"}";
                    }
                }
            } catch (Exception e) {
                jsonResponse = "{\"status\":\"error\", \"message\":\"" + e.getMessage() + "\"}";
            }
            ServerUtils.sendJSONResponse(exchange, jsonResponse);
        }
    }
}
