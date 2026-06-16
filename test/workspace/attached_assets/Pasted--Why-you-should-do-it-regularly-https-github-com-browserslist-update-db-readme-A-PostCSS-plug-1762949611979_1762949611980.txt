  Why you should do it regularly: https://github.com/browserslist/update-db#readme

A PostCSS plugin did not pass the `from` option to `postcss.parse`. This may cause imported assets to be incorrectly transformed. If you've recently added a PostCSS plugin that raised this warning, please contact the package author to fix the issue.
Failed to send email: Error: Invalid login: 535 5.7.8 Error: authentication failed: (reason unavailable)
    at SMTPConnection._formatError (/home/runner/workspace/node_modules/nodemailer/lib/smtp-connection/index.js:809:19)
    at SMTPConnection._actionAUTHComplete (/home/runner/workspace/node_modules/nodemailer/lib/smtp-connection/index.js:1595:34)
    at SMTPConnection.<anonymous> (/home/runner/workspace/node_modules/nodemailer/lib/smtp-connection/index.js:556:26)
    at SMTPConnection._processResponse (/home/runner/workspace/node_modules/nodemailer/lib/smtp-connection/index.js:993:20)
    at SMTPConnection._onData (/home/runner/workspace/node_modules/nodemailer/lib/smtp-connection/index.js:774:14)
    at SMTPConnection._onSocketData (/home/runner/workspace/node_modules/nodemailer/lib/smtp-connection/index.js:195:44)
    at TLSSocket.emit (node:events:524:28)
    at addChunk (node:internal/streams/readable:561:12)
    at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
    at Readable.push (node:internal/streams/readable:392:5)
    at TLSWrap.onStreamRead (node:internal/stream_base_commons:191:23) {
  code: 'EAUTH',
  response: '535 5.7.8 Error: authentication failed: (reason unavailable)',
  responseCode: 535,
  command: 'AUTH PLAIN'
}
12:09:48 PM [express] POST /api/auth/send-code 500 in 3036ms :: {"error":"Failed to send verification…
12:10:03 PM [express] POST /api/auth/send-code 400 in 93ms :: {"error":"Email already registered"}
Failed to send email: Error: Invalid login: 535 5.7.8 Error: authentication failed: (reason unavailable)
    at SMTPConnection._formatError (/home/runner/workspace/node_modules/nodemailer/lib/smtp-connection/index.js:809:19)
    at SMTPConnection._actionAUTHComplete (/home/runner/workspace/node_modules/nodemailer/lib/smtp-connection/index.js:1595:34)
    at SMTPConnection.<anonymous> (/home/runner/workspace/node_modules/nodemailer/lib/smtp-connection/index.js:556:26)
    at SMTPConnection._processResponse (/home/runner/workspace/node_modules/nodemailer/lib/smtp-connection/index.js:993:20)
    at SMTPConnection._onData (/home/runner/workspace/node_modules/nodemailer/lib/smtp-connection/index.js:774:14)
    at SMTPConnection._onSocketData (/home/runner/workspace/node_modules/nodemailer/lib/smtp-connection/index.js:195:44)
    at TLSSocket.emit (node:events:524:28)
    at addChunk (node:internal/streams/readable:561:12)
    at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
    at Readable.push (node:internal/streams/readable:392:5)
    at TLSWrap.onStreamRead (node:internal/stream_base_commons:191:23) {
  code: 'EAUTH',
  response: '535 5.7.8 Error: authentication failed: (reason unavailable)',
  responseCode: 535,
  command: 'AUTH PLAIN'
}
12:10:58 PM [express] POST /api/auth/send-code 500 in 2452ms :: {"error":"Failed to send verification…
Failed to send email: Error: Invalid login: 535 5.7.8 Error: authentication failed: (reason unavailable)
    at SMTPConnection._formatError (/home/runner/workspace/node_modules/nodemailer/lib/smtp-connection/index.js:809:19)
    at SMTPConnection._actionAUTHComplete (/home/runner/workspace/node_modules/nodemailer/lib/smtp-connection/index.js:1595:34)
    at SMTPConnection.<anonymous> (/home/runner/workspace/node_modules/nodemailer/lib/smtp-connection/index.js:556:26)
    at SMTPConnection._processResponse (/home/runner/workspace/node_modules/nodemailer/lib/smtp-connection/index.js:993:20)
    at SMTPConnection._onData (/home/runner/workspace/node_modules/nodemailer/lib/smtp-connection/index.js:774:14)
    at SMTPConnection._onSocketData (/home/runner/workspace/node_modules/nodemailer/lib/smtp-connection/index.js:195:44)
    at TLSSocket.emit (node:events:524:28)
    at addChunk (node:internal/streams/readable:561:12)
    at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
    at Readable.push (node:internal/streams/readable:392:5)
    at TLSWrap.onStreamRead (node:internal/stream_base_commons:191:23) {
  code: 'EAUTH',
  response: '535 5.7.8 Error: authentication failed: (reason unavailable)',
  responseCode: 535,
  command: 'AUTH PLAIN'
}
12:11:05 PM [express] POST /api/auth/send-code 500 in 2866ms :: {"error":"Failed to send verification…
