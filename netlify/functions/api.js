import express from "express";
import cors from "cors";
import { createServer } from "../../server/index.js";

let app = null;

// Initialize the Express app once
function getApp() {
  if (!app) {
    app = createServer();
  }
  return app;
}

export async function handler(event, context) {
  const app = getApp();

  return new Promise((resolve) => {
    const req = {
      method: event.httpMethod,
      url: event.path + (event.rawQuery ? `?${event.rawQuery}` : ""),
      headers: event.headers,
      body: event.body ? JSON.parse(event.body) : null,
    };

    const res = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Content-Type": "application/json",
      },
      body: "",
      json: function (data) {
        this.body = JSON.stringify(data);
        return this;
      },
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      send: function (data) {
        this.body = typeof data === "string" ? data : JSON.stringify(data);
        return this;
      },
      sendFile: function (path) {
        // For SPA files, return the index.html
        this.body = "SPA content";
        return this;
      },
    };

    // Handle CORS preflight
    if (event.httpMethod === "OPTIONS") {
      resolve({
        statusCode: 200,
        headers: res.headers,
        body: "OK",
      });
      return;
    }

    // Use Express app to handle the request
    const mockRequest = new (require("http").IncomingMessage)();
    const mockResponse = new (require("http").ServerResponse)(mockRequest);

    // Copy properties to mock request
    Object.assign(mockRequest, {
      method: event.httpMethod,
      url: event.path + (event.rawQuery ? `?${event.rawQuery}` : ""),
      headers: event.headers,
    });

    // Mock response end handler
    mockResponse.end = function () {
      const body = this._getData ? this._getData() : res.body;
      resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        body: body,
      });
    };

    // Monkey patch response methods
    const originalJson = mockResponse.json;
    mockResponse.json = function (data) {
      this.setHeader("Content-Type", "application/json");
      this.end(JSON.stringify(data));
      return this;
    };

    const originalSend = mockResponse.send;
    mockResponse.send = function (data) {
      this.end(typeof data === "string" ? data : JSON.stringify(data));
      return this;
    };

    const originalStatus = mockResponse.status;
    mockResponse.status = function (code) {
      this.statusCode = code;
      return this;
    };

    // Handle request body
    let rawBody = "";
    if (event.body) {
      rawBody = event.body;
      mockRequest.rawBody = rawBody;
    }

    mockRequest.on = function (event, callback) {
      if (event === "data") {
        if (rawBody) {
          callback(Buffer.from(rawBody));
        }
      } else if (event === "end") {
        callback();
      }
    };

    // Call Express app
    try {
      app(mockRequest, mockResponse);
    } catch (error) {
      console.error("Error handling request:", error);
      resolve({
        statusCode: 500,
        headers: res.headers,
        body: JSON.stringify({
          success: false,
          message: "Server error",
          error: error.message,
        }),
      });
    }
  });
}
