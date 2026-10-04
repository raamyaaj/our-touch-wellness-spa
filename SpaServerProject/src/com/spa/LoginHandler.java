package com.spa;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.*;
import java.sql.*;
import java.util.Map;

public class LoginHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            String jsonResponse = "";
            try {
                String formData = ServerUtils.getFormData(exchange);
                Map<String, String> inputs = ServerUtils.parseFormData(formData);
                
                String user = inputs.get("username") != null ? inputs.get("username").trim() : "";
                String pass = inputs.get("password");

                try (Connection conn = DriverManager.getConnection(SpaServer.DB_URL, SpaServer.DB_USER, SpaServer.DB_PASS)) {
                    String sql = "SELECT role FROM users WHERE username = ? AND password = ?";
                    PreparedStatement ps = conn.prepareStatement(sql);
                    ps.setString(1, user);
                    ps.setString(2, pass);
                    ResultSet rs = ps.executeQuery();

                    if (rs.next()) {
                        String role = rs.getString("role");
                     // Isabit sa loob ng SUCCESS LOGIN block:
                        ServerUtils.logActivity("User '" + user + "' successfully logged in with role: " + role);

                        jsonResponse = "{\"status\":\"success\", \"role\":\"" + role + "\"}";
                    } else {
                        jsonResponse = "{\"status\":\"failed\", \"message\":\"Hindi tugma ang Username o Password.\"}";
                    }
                }
            } catch (Exception e) {
                jsonResponse = "{\"status\":\"error\", \"message\":\"" + e.getMessage() + "\"}";
            }
            ServerUtils.sendJSONResponse(exchange, jsonResponse);
        }
    }
}
