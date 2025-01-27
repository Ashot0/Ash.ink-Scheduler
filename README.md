# Ash.ink Scheduler

Ash.ink Scheduler is a simple application that automates the process of publishing Pinterest pins to Telegram channels. It leverages the Pinterest API and Telegram Bot API to streamline content sharing.

## Features

- Fetches pins from your Pinterest account.
- Automatically posts pins to a specified Telegram channel.
- Runs on a scheduled basis (e.g., hourly).

## Requirements

To use this application, you will need:

- Node.js installed on your machine.
- Access to the Pinterest API (approved application).
- A Telegram bot and its API token.
- Administrator access to the Telegram channel where the pins will be posted.

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Ashot0/Ash.ink-Scheduler
cd Ash.ink-Scheduler
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory and populate it with values from the provided `env.sample`.

### 4. Get Pinterest Access Code

To get the Pinterest authorization code, run:

```bash
node CodeURLGenerator.js
```

This will generate the URL for obtaining the authorization code from Pinterest.

### 5. Get Pinterest Access Token and Refresh Token

Once you have the authorization code, run:

```bash
node testPinterestAuth.js
```

This will provide you with your access and refresh tokens for Pinterest API access.

### 6. Run the Application

To start the application, run:

```bash
node app.js
```

## How It Works

1. The application uses your Pinterest Access Token to fetch pins from your saved content.
2. It formats the pins and sends them to your Telegram channel using the Telegram Bot API.
3. Posts are sent automatically at the specified interval defined in the `.env` file.

## Customization

- You can adjust the `SCHEDULE_INTERVAL` in the `.env` file to modify the frequency of posts.
- Modify the `app.js` file to include additional features or customize the pin formatting.

## Contributing

We welcome contributions! Feel free to fork the repository and submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please open an issue on the [GitHub repository](https://github.com/Ashot0/Ash.ink-Scheduler).
