# Form Server

A basic server that takes in a post request and resends validated and sanitized data to an email address.

## Run Locally

Clone the project

```bash
  git clone https://github.com/denefi/form-server
```

Go to the project directory

```bash
  cd my-project
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run start
```

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`EMAIL`

The email or username for SMTP

`HOST`

SMTP Server

`PASSWORD`

SMTP Password

`RECEIVER`

The email address to which the contact formular should be forwarded to.

## Test with curl

curl -X POST localhost:3000/mail \
-H 'Content-Type: application/json' \
-d '{"name":"test-name","contactMessage":"Test Message", "dataProtection":"true"}'
