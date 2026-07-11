
declare module 'nodemailer' {
  interface SendMailOptions {
    from?: string;
    to?: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject?: string;
    text?: string;
    html?: string;
    attachments?: Array<{
      filename?: string;
      content?: string | Buffer;
      path?: string;
      contentType?: string;
    }>;
    headers?: Record<string, string>;
    replyTo?: string;
  }

  interface SentMessageInfo {
    messageId: string;
    envelope: object;
    accepted: string[];
    rejected: string[];
    response: string;
  }

  interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user?: string;
      pass?: string;
    };
    tls?: {
      rejectUnauthorized?: boolean;
      ciphers?: string;
    };
    service?: string;
    debug?: boolean;
    logger?: boolean;
    connectionTimeout?: number;
    greetingTimeout?: number;
    socketTimeout?: number;
  }

  interface Transporter {
    sendMail(mailOptions: SendMailOptions): Promise<SentMessageInfo>;
    verify(callback?: (error: Error | null, success: boolean) => void): Promise<boolean>;
    close(): void;
  }

  function createTransport(options: TransportOptions | string): Transporter;

  const nodemailer: {
    createTransport: typeof createTransport;
  };

  export { Transporter, SendMailOptions, SentMessageInfo, TransportOptions };
  export default nodemailer;
  export { createTransport };
}
