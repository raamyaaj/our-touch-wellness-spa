package com.spa;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.*;
import java.sql.*;
import java.util.Map;

public class AdminDataHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String jsonResponse = "[]";
        
        try (Connection conn = DriverManager.getConnection(SpaServer.DB_URL, SpaServer.DB_USER, SpaServer.DB_PASS)) {
            
            // 1. PATH: KUNIN ANG MGA USERS ACCOUNTS
            if (path.equals("/admin/get-users")) {
                String sql = "SELECT username, contact, status FROM users WHERE role = 'USER'";
                Statement st = conn.createStatement();
                ResultSet rs = st.executeQuery(sql);
                StringBuilder sb = new StringBuilder("[");
                while (rs.next()) {
                    sb.append(String.format("{\"username\":\"%s\",\"contact\":\"%s\",\"status\":\"%s\"},", 
                        rs.getString("username"), rs.getString("contact"), rs.getString("status")));
                }
                if (sb.length() > 1) sb.setLength(sb.length() - 1);
                sb.append("]");
                jsonResponse = sb.toString();
            }
            
            // 2. PATH: SOFT DELETE / ARCHIVE / RESTORE TOGGLE NG USER (WALANG DIRETSONG BURAHAN!)
            else if (path.equals("/admin/toggle-user-status") && "POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                String formData = ServerUtils.getFormData(exchange);
                Map<String, String> inputs = ServerUtils.parseFormData(formData);
                String targetUser = inputs.get("username");
                String currentStatus = inputs.get("currentStatus");
                
                String newStatus = "Archived".equals(currentStatus) ? "Approved" : "Archived";
                
                String sql = "UPDATE users SET status = ? WHERE username = ? AND role = 'USER'";
                PreparedStatement ps = conn.prepareStatement(sql);
                ps.setString(1, newStatus);
                ps.setString(2, targetUser);
                ps.executeUpdate();
                
                // 🚀 INILAGAY DITO: Isabit sa dulo ng SUCCESS TOGGLE STATUS (Archive/Restore) block:
                ServerUtils.logActivity("Admin toggled user state access account for '" + targetUser + "' to " + newStatus);
                
                jsonResponse = "{\"status\":\"success\",\"newStatus\":\"" + newStatus + "\"}";
            }
            
            // 3. PATH: KUNIN ANG APPOINTMENTS / SCHEDULES
            else if (path.equals("/admin/get-schedules")) {
                String sql = "SELECT * FROM bookings ORDER BY booking_id DESC";
                Statement st = conn.createStatement();
                ResultSet rs = st.executeQuery(sql);
                StringBuilder sb = new StringBuilder("[");
                while (rs.next()) {
                    sb.append(String.format("{\"id\":%d,\"name\":\"%s\",\"date\":\"%s\",\"service\":\"%s\",\"promo\":\"%s\",\"status\":\"%s\"},",
                        rs.getInt("booking_id"), rs.getString("customer_username"), rs.getString("appointment_date"),
                        rs.getString("service_name"), rs.getString("promo_applied"), rs.getString("status")));
                }
                if (sb.length() > 1) sb.setLength(sb.length() - 1);
                sb.append("]");
                jsonResponse = sb.toString();
            }
            
            // 4. PATH: UPDATE APPOINTMENT STATUS (ACTIVE, COMPLETED, CANCELLED)
            else if (path.equals("/admin/update-booking-status") && "POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                String formData = ServerUtils.getFormData(exchange);
                Map<String, String> inputs = ServerUtils.parseFormData(formData);
                int bookingId = Integer.parseInt(inputs.get("id"));
                String newStatus = inputs.get("status");
                
                String sql = "UPDATE bookings SET status = ? WHERE booking_id = ?";
                PreparedStatement ps = conn.prepareStatement(sql);
                ps.setString(1, newStatus);
                ps.setInt(2, bookingId);
                ps.executeUpdate();
                
                // 🚀 INILAGAY DITO: Isabit sa dulo ng SUCCESS UPDATE BOOKING STATUS block:
                ServerUtils.logActivity("Admin updated booking ID #" + bookingId + " appointment status to: " + newStatus);
                
                jsonResponse = "{\"status\":\"success\"}";
            }

        } catch (Exception e) {
            jsonResponse = "{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}";
        }
        
        ServerUtils.sendJSONResponse(exchange, jsonResponse);
    }
}
