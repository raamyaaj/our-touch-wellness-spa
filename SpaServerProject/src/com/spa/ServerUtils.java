package com.spa;

import com.sun.net.httpserver.HttpExchange;
import java.io.*;
import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Map;

public class ServerUtils {
    public static String getFormData(HttpExchange exchange) throws IOException {
        InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), "utf-8");
        BufferedReader br = new BufferedReader(isr);
        return br.readLine();
    }

    public static Map<String, String> parseFormData(String formData) throws UnsupportedEncodingException {
        Map<String, String> map = new HashMap<>();
        if (formData == null || formData.isEmpty()) return map;
        
        String[] pairs = formData.split("&");
        for (String pair : pairs) {
            String[] kv = pair.split("=");
            String key = URLDecoder.decode(kv[0], "UTF-8");
            String val = kv.length > 1 ? URLDecoder.decode(kv[1], "UTF-8") : "";
            map.put(key, val);
        }
        return map;
    }

    public static void sendJSONResponse(HttpExchange exchange, String json) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(200, json.getBytes("UTF-8").length);
        OutputStream os = exchange.getResponseBody();
        os.write(json.getBytes("UTF-8"));
        os.close();
    }
    
 // I-PASTE ITO SA LOOB NG STATIC CLASS SERVERUTILS MO:
    public static void logActivity(String message) {
        // DIRETSONG PARAMETERS: Hindi na ito aasa sa variable ng ibang class para walang pula!
        String url = "jdbc:mysql://localhost:3306/spa_booking_db";
        String user = "root";
        String pass = "1101"; // ⚠️ Siguraduhing tugma sa MySQL password mo (tulad ng 1101)

        try {
            // Sapilitang i-load ang MySQL Driver para makasiguro sa standalone projects
            Class.forName("com.mysql.cj.jdbc.Driver");
            
            try (java.sql.Connection conn = java.sql.DriverManager.getConnection(url, user, pass)) {
                String sql = "INSERT INTO audit_logs (message) VALUES (?)";
                try (java.sql.PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setString(1, message);
                    ps.executeUpdate();
                    System.out.println("📝 [AUDIT LOG]: " + message);
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to write audit log entries trail: " + e.getMessage());
        }
    }


}
