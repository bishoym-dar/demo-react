// WARNING: INTENTIONALLY INSECURE CODE. Exists only to verify CodeQL detection.
// Do not merge or use in production.
import { useEffect, useRef, useState } from "react";
import { exec } from "child_process";
import * as fs from "fs";
import * as crypto from "crypto";

// Hardcoded credentials (js/hardcoded-credentials)
const API_KEY = "hardcoded-demo-api-key-not-real";
const DB_PASSWORD = "SuperSecretPassword123!";

// Weak hashing (js/weak-cryptographic-algorithm / insufficient-password-hash)
export function hashPassword(password: string): string {
  return crypto.createHash("md5").update(password).digest("hex");
}

// Insecure randomness for a token (js/insecure-randomness)
export function makeToken(): string {
  return Math.random().toString(36).slice(2);
}

// Command injection (js/command-line-injection)
export function ping(host: string) {
  exec("ping -c 1 " + host, (_err, out) => console.log(out));
}

// Path traversal (js/path-injection)
export function readUserFile(name: string): string {
  return fs.readFileSync("/var/data/" + name, "utf8");
}

// SQL injection (js/sql-injection style string concatenation)
export function buildQuery(userId: string): string {
  return "SELECT * FROM users WHERE id = '" + userId + "' AND pw = '" + DB_PASSWORD + "'";
}

// Code injection (js/code-injection)
export function calc(expr: string) {
  return eval(expr);
}

// Regex DoS (js/polynomial-redos / js/redos)
export function isValid(input: string): boolean {
  return /^(a+)+$/.test(input);
}

// Logging sensitive data (js/clear-text-logging)
export function logSecrets() {
  console.log("Using API key: " + API_KEY);
}

export default function VulnerableDemo() {
  const [html, setHtml] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get("name") ?? "";

    // DOM XSS (js/xss-through-dom)
    if (ref.current) {
      ref.current.innerHTML = "<h1>Hello " + name + "</h1>";
    }
    document.write(name);

    // Open redirect (js/client-side-unvalidated-url-redirection)
    const next = params.get("next");
    if (next) window.location.href = next;

    // Insecure postMessage handling (js/missing-origin-check)
    window.addEventListener("message", (e) => setHtml(e.data));

    // Sensitive data in localStorage / insecure http
    localStorage.setItem("password", DB_PASSWORD);
    fetch("http://example.com/api?key=" + API_KEY);
  }, []);

  return (
    <div>
      <div ref={ref} />
      {/* React XSS (js/xss) */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
