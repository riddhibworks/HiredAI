package com.hiredai.backend.service;

import org.springframework.stereotype.Component;

import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;

/**
 * Blocks user-supplied feed URLs from targeting loopback/private/link-local
 * addresses (SSRF guard) before the server ever fetches them.
 */
@Component
public class FeedUrlValidator {

    public void validateOrThrow(String rawUrl) {
        URI uri;
        try {
            uri = URI.create(rawUrl);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Not a valid URL");
        }

        String scheme = uri.getScheme();
        if (scheme == null || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
            throw new IllegalArgumentException("Feed URL must use http or https");
        }

        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new IllegalArgumentException("Feed URL must include a host");
        }

        InetAddress[] addresses;
        try {
            addresses = InetAddress.getAllByName(host);
        } catch (UnknownHostException e) {
            throw new IllegalArgumentException("Could not resolve feed host");
        }

        for (InetAddress address : addresses) {
            if (isDisallowed(address)) {
                throw new IllegalArgumentException("Feed URL resolves to a disallowed network address");
            }
        }
    }

    private boolean isDisallowed(InetAddress address) {
        if (address.isLoopbackAddress() || address.isLinkLocalAddress() || address.isSiteLocalAddress()
                || address.isAnyLocalAddress() || address.isMulticastAddress()) {
            return true;
        }
        byte[] bytes = address.getAddress();
        if (address instanceof Inet6Address && bytes.length == 16) {
            // IPv6 unique local addresses (fc00::/7) aren't covered by isSiteLocalAddress.
            int first = bytes[0] & 0xff;
            if (first == 0xfc || first == 0xfd) {
                return true;
            }
        }
        if (address instanceof Inet4Address && bytes.length == 4 && (bytes[0] & 0xff) == 169 && (bytes[1] & 0xff) == 254) {
            return true; // cloud metadata / link-local, in case isLinkLocalAddress ever misses it
        }
        return false;
    }
}
