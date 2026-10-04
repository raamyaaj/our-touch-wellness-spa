package com.spa;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.*;
import java.sql.*;

public class ServicesCatalogHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            String jsonResponse = "[]";
            
            // Kukunin ang DB details mula sa iyong main SpaServer/SpaSystem file
            try (Connection conn = DriverManager.getConnection(SpaServer.DB_URL, SpaServer.DB_USER, SpaServer.DB_PASS)) {
                String sql = "SELECT * FROM services WHERE status = 'Active'";
                Statement st = conn.createStatement();
                ResultSet rs = st.executeQuery(sql);
                
                StringBuilder sb = new StringBuilder("[");
                while (rs.next()) {
                    sb.append(String.format("{\"id\":%d,\"name\":\"%s\",\"price\":%d,\"desc\":\"%s\"},",
                        rs.getInt("service_id"), 
                        rs.getString("service_name"), 
                        rs.getInt("price"), 
                        rs.getString("description")));
                }
                if (sb.length() > 1) sb.setLength(sb.length() - 1); // alisin ang huling koma
                sb.append("]");
                jsonResponse = sb.toString();
                
            } catch (Exception e) {
                jsonResponse = "{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}";
            }
            
            ServerUtils.sendJSONResponse(exchange, jsonResponse);
        }
    }
}
