# Attention Button Backend

This is the backend implementation for the
[Attention Button](https://theattentionbutton.in), handling MQTT communication,
authentication, and API requests. It is designed to run behind an Nginx instance
that handles TLS termination.

## Usage

### Running the Backend

The server expects a `config.json` file in the current directory, but you can
override this by setting the `TAB_CONFIG_FILE` environment variable.

```sh
TAB_CONFIG_FILE=/path/to/config.json node src/main.ts
```

Alternatively, for development mode:

```sh
TAB_ENV=dev node src/main.ts
```

You can also simply run `nodemon` to start a server with live-reloading.

### Configuration

The configuration is defined as a JSON object and an example is given in
[config.example.json](./config.example.json).

#### Required Fields:

- `smtpHost`: SMTP server hostname.
- `smtpPort`: SMTP server port.
- `smtpUsername`: SMTP authentication username.
- `smtpPassword`: SMTP authentication password.
- `secrets`: Array of secret keys used as the cookie secret.
- `captchaSecret`: Secret key for hCaptcha verification.

#### Optional Fields:

- `hostname`: Defaults to `0.0.0.0`.
- `httpPort`: Defaults to `8000`.
- `smtpSecure`: Whether to use secure SMTP (`true` for TLS, `false` for
  STARTTLS). Defaults to `false`.
- `storeUrl`: URL for the Attention Button store.
- `mqttPort`: Defaults to `1883`.
- `mqttTls`: If `true`, additional fields `keyPath`, `certPath`, and `caPath`
  must be provided for TLS support.

Example for MQTT over TLS:

```json
{
    "mqttTls": true,
    "keyPath": "/etc/ssl/private/mqtt.key",
    "certPath": "/etc/ssl/certs/mqtt.crt",
    "caPath": "/etc/ssl/certs/ca.pem"
}
```

## Running Your Own Instance

The recommended setup is to run this backend behind an Nginx instance that
handles HTTPS termination. Ensure that your Nginx configuration properly proxies
requests to the backend.

## Contributing

Contributions are welcome! If you find an issue or want to suggest improvements,
feel free to open a pull request.

## Hosted Instance

You can use the hosted instance at
[theattentionbutton.in](https://theattentionbutton.in).

Acknowledgements

This project uses the following libraries:

## Acknowledgements

## Acknowledgements

- [aedes](https://npmjs.com/package/aedes) Copyright © 2015 Matteo Collina, The
  MIT License
- [argon2](https://npmjs.com/package/argon2) Copyright © 2015 Ranieri Althoff,
  The MIT License
- [better-sqlite3](https://npmjs.com/package/better-sqlite3) Copyright © 2016
  Joshua Wise, The MIT License
- [better-sqlite3-session-store](https://npmjs.com/package/better-sqlite3-session-store)
  Copyright © 2020 Tim Daubenschütz, GPL-3.0-only
- [cors](https://npmjs.com/package/cors) Copyright © 2013 Troy Goode, The MIT
  License
- [escape-html](https://npmjs.com/package/escape-html) Copyright © 2012
  [component](https://github.com/component), The MIT License
- [express](https://npmjs.com/package/express) Copyright © 2010 TJ Holowaychuk,
  The MIT License
- [express-rate-limit](https://npmjs.com/package/express-rate-limit) Copyright ©
  2014 Nathan Friedly, The MIT License
- [express-session](https://npmjs.com/package/express-session) Copyright © 2014
  TJ Holowaychuk, The MIT License
- [hcaptcha](https://npmjs.com/package/hcaptcha) Copyright © 2018 Juho Hautala,
  The MIT License
- [http-status-codes](https://npmjs.com/package/http-status-codes) Copyright ©
  2013 Bryce Neal, The MIT License
- [kysely](https://npmjs.com/package/kysely) Copyright © 2021 Sami Koskimäki,
  The MIT License
- [liquidjs](https://npmjs.com/package/liquidjs) Copyright © 2017 Harttle, The
  MIT License
- [nodemailer](https://npmjs.com/package/nodemailer) Copyright © 2011 Andris
  Reinman, The MIT-0 License
- [nodemailer-smtp-transport](https://npmjs.com/package/nodemailer-smtp-transport)
  Copyright © 2014 Andris Reinman, The MIT License
- [random-words](https://npmjs.com/package/random-words) Copyright © 2013
  Apostrophe Technologies, The MIT License
- [zod](https://npmjs.com/package/zod) Copyright © 2020 Colin McDonnell, The MIT
  License
- [zod-validation-error](https://npmjs.com/package/zod-validation-error)
  Copyright © 2022 Dimitrios C. Michalakos, The MIT License

## License

MIT License. See `LICENSE` for details.
