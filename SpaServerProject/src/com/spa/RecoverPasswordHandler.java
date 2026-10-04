package com.spa;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.*;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.HashMap;
import java.util.Map;

public class RecoverPasswordHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            // Basahin ang pinasok na string payload body data stream line handles
            InputStream is = exchange.getRequestBody();
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            byte[] buffer = new byte[1024];
            int len;
            while ((len = is.read(buffer)) != -1) { bos.write(buffer, 0, len); }
            String body = bos.toString(StandardCharsets.UTF_8);

            // Hatiin at i-decode ang x-www-form-urlencoded values query map
            Map<String, String> params = new HashMap<>();
            String[] pairs = body.split("&");
            for (String pair : pairs) {
                String[] idx = pair.split("=");
                String key = URLDecoder.decode(idx[0], StandardCharsets.UTF_8);
                String value = idx.length > 1 ? URLDecoder.decode(idx[1], StandardCharsets.UTF_8) : "";
                params.put(key, value);
            }

            String username = params.get("username");
            String contact = params.get("contact");
            String jsonResponse = "";

            try (Connection conn = DriverManager.getConnection(SpaServer.DB_URL, SpaServer.DB_USER, SpaServer.DB_PASS)) {
                // I-verify kung tugma ang username at contact fields sa iisang database table row record element links
                String sql = "SELECT password FROM users WHERE username = ? AND contact = ? AND status != 'Archived'";
                PreparedStatement ps = conn.prepareStatement(sql);
                ps.setString(1, username);
                ps.setString(2, contact);
                ResultSet rs = ps.executeQuery();

                if (rs.next()) {
                    String passwordStr = rs.getString("password");
                    jsonResponse = String.format("{\"status\":\"success\",\"password\":\"%s\"}", passwordStr.replace("\"", "\\\""));
                } else {
                    jsonResponse = "{\"status\":\"error\",\"message\":\"Maling Username o Contact Number. Hindi nagtutugma ang mga impormasyon sa database.\"}";
                }
            } catch (Exception e) {
                jsonResponse = "{\"status\":\"error\",\"message\":\"Database server connection fault parameter crash trace: " + e.getMessage() + "\"}";
            }

            ServerUtils.sendJSONResponse(exchange, jsonResponse);
        }
    }
}
