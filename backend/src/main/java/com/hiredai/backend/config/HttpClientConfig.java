package com.hiredai.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
public class HttpClientConfig {

    /**
     * Standard RestClient for official public job adapters (RemoteOK, Himalayas, Jobicy, Arbeitnow, etc.).
     * Strictly bounded by 4s connect and 6s read timeouts to prevent any external slow or hung API
     * from delaying feed ingestion or blocking background worker threads.
     */
    @Bean
    public RestClient restClient() {
        HttpClient httpClient = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .connectTimeout(Duration.ofSeconds(4))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(6));
        return RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    /**
     * Used only for user-supplied feed URLs. Redirects are disabled so a feed can't
     * bounce the request to an internal address after the initial SSRF host check.
     */
    @Bean
    public RestClient feedRestClient() {
        HttpClient httpClient = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NEVER)
                .connectTimeout(Duration.ofSeconds(4))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(5));
        return RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }
}
