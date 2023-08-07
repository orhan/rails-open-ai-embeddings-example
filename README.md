# AskMyBook (OpenAI embeddings in Rails example)

This project is a rebuild of Sahil Lavingia's [AskMyBook project](https://github.com/slavingia/askmybook) in Rails.
It makes allows you to train an AI on any PDF and ask questions to it.

## Getting Started

To get started with this project, follow these steps:

1. Make sure you have Ruby and Ruby on Rails installed on your machine.

2. Clone this repository to your local machine:

```bash
git clone https://github.com/orhan/rails-open-ai-embeddings-example
cd rails-open-ai-embeddings-example
```

3. Copy `env.example` to `.env` and add your OpenAI API key.

4. Install project dependencies:

```bash
bundle install
```

5. Set up the database:

   1. Run

   ```bash
   rails db:create
   rails db:migrate
   ```

   2. (Optional) If you want to test the project with Sahil Lavingia's book "The Minimalist Entrepreneur: How Great Founders Do More with Less", run the following command, otherwise you'll have to enter some basic info about the PDF/book later on:

   ```bash
   rails db:seed
   ```

6. Train the AI on your PDF and ask questions:

   1. Start the server by running:

   ```bash
   foreman start -f Procfile.dev
   ```

   2. If you want to use your own book/PDF:
      1. **Important**: Place your PDF under `training_data` as `book.pdf`
      2. Open `127.0.0.1:3000/train_ai` and enter the basic info about your book and press 'Start AI training'. This might take a while (depending on your PDF), but the app will display the progress and tell you when it's finished.

   3. Once that is done (or you've run `rails db:seed` previously), open `127.0.0.1:3000` to start asking questions.
