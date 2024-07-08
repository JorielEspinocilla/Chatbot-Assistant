
# OMPH

A Chatbot for Organic Market PH website


## Installing Modules


## Secret Keys

To run this project, create an .env file, you will need to add the following environment variables to your .env file:

`OPENAI_API_KEY` = YOUR_OPENAI_API_KEY

`OPENAI_ASSISTANT_ID` = YOUR_OPENAI_ASSISTANT_ID



## API Testing

#### Get Thread Id

```http
  GET http://hostname:8080/start
```


#### Make Query

```http
  POST http://hostname:8080/chat
```

Go to body --> raw(JSON) put the following command

```bash
{
  "thread_id": "your_thread_id_here",
  "message": "Hello, how are you?"
}

```

