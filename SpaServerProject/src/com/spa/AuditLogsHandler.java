package com.spa;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.*;
import java.sql.*;

public class AuditLogsHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            String jsonResponse = "[]";
            
            try (Connection conn = DriverManager.getConnection(SpaServer.DB_URL, SpaServer.DB_USER, SpaServer.DB_PASS)) {
                // Kukunin ang mga logs at iaayos mula sa pinakabago pababa (reverse timeline trace)
                String sql = "SELECT * FROM audit_logs ORDER BY log_id DESC";
                Statement st = conn.createStatement();
                ResultSet rs = st.executeQuery(sql);
                
                StringBuilder sb = new StringBuilder("[");
                while (rs.next()) {
                    sb.append(String.format("{\"timestamp\":\"%s\",\"message\":\"%s\"},",
                        rs.getTimestamp("log_timestamp").toString(),
                        rs.getString("message")));
                }
                if (sb.length() > 1) sb.setLength(sb.length() - 1);
                sb.append("]");
                jsonResponse = sb.toString();
                
            } catch (Exception e) {
                jsonResponse = "{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}";
            }
            
            ServerUtils.sendJSONResponse(exchange, jsonResponse);
        }
    }
}
