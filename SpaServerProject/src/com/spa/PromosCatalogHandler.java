package com.spa;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.*;
import java.sql.*;

public class PromosCatalogHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            String jsonResponse = "[]";
            
            try (Connection conn = DriverManager.getConnection(SpaServer.DB_URL, SpaServer.DB_USER, SpaServer.DB_PASS)) {
                // Kukunin natin ang lahat ng columns mula sa promos table
                String sql = "SELECT * FROM promos WHERE status = 'Active'";
                Statement st = conn.createStatement();
                ResultSet rs = st.executeQuery(sql);
                
                StringBuilder sb = new StringBuilder("[");
                while (rs.next()) {
                    int promoId = rs.getInt("promo_id");
                    String promoName = rs.getString("promo_name");
                    
                    // LIGTAS NA PROPRIETARY CHECK: Kung walang description column, bigyan ng backup string
                    String promoDesc = "Special relaxation discount voucher pack.";
                    try {
                        promoDesc = rs.getString("description");
                    } catch (Exception e) {
                        // Hayaan lang kung walang description column sa table mo
                    }
                    
                    // DITO NATIN SESEMENTOHIN ANG MGA KEYS NA IPAPADALA SA JAVASCRIPT:
                    sb.append(String.format("{\"id\":%d,\"name\":\"%s\",\"desc\":\"%s\"},",
                        promoId, 
                        promoName.replace("\"", "\\\""), 
                        promoDesc.replace("\"", "\\\"")));
                }
                if (sb.length() > 1) sb.setLength(sb.length() - 1); // Alisin ang huling koma
                sb.append("]");
                jsonResponse = sb.toString();
                
            } catch (Exception e) {
                // I-print sa Eclipse console para makita mo ang totoong error line kung mayroon man
                System.err.println("❌ [DATABASE PROMO ERROR]: " + e.getMessage());
                jsonResponse = "{\"status\":\"error\",\"message\":\"" + e.getMessage().replace("\"", "\\\"") + "\"}";
            }
            
            ServerUtils.sendJSONResponse(exchange, jsonResponse);
        }
    }
}
