import boto3
import pandas as pd
from io import StringIO
import socketio
from dotenv import load_dotenv
import os
import numpy as np
import tiktoken
import pandas as pd
import openai

load_dotenv()
sio = socketio.Server()
app = socketio.WSGIApp(sio)
COMPLETIONS_MODEL = "text-davinci-003"
EMBEDDING_MODEL = "text-embedding-ada-002"
MAX_SECTION_LEN = 500
SEPARATOR = "\n* "
ENCODING = "gpt2"  # encoding for text-davinci-003
openai.api_key = os.getenv('CHRIS_OPENAI_KEY')
encoding = tiktoken.get_encoding(ENCODING)
separator_len = len(encoding.encode(SEPARATOR))

#### Answer the Question Now
COMPLETIONS_API_PARAMS = {
    # We use temperature of 0.0 because it gives the most predictable, factual answer.
    # Temperature 0 means we get the same answer every time
    # max_tokens is the size of the response
    "temperature": 0.0,
    "max_tokens": 500,
    "model": COMPLETIONS_MODEL,
}


class FaqResponse():

    def __init__(self):
        self.client = boto3.client('s3', aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'), aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'))

        ### AWS Files
        self.bucket = "vpf2content"
        self.key_text_csv = "Uploads/R24Files/cancer_faq.csv"
        self.key_embeddings_csv = 'Uploads/R24Files/cancer_faq_embeddings.csv'

        self.s3_client = boto3.client('s3')
        self.df_text = pd.DataFrame
        self.df_embeddings = pd.DataFrame
        try:
            response = self.s3_client.get_object(Bucket=self.bucket, Key=self.key_text_csv)
            body = response['Body']
            csv_string = body.read().decode('utf-8')

            self.df_text = pd.read_csv(StringIO(csv_string))
            
        except Exception as e:
            print(f"Error retrieving CSV File: {e}")

        try:
            response = self.s3_client.get_object(Bucket=self.bucket, Key=self.key_embeddings_csv)
            body = response['Body']
            csv_string = body.read().decode('utf-8')

            self.df_embeddings = pd.read_csv(StringIO(csv_string))
            
        except Exception as e:
            print(f"Error retrieving CSV File: {e}")

        self.embeddings_dict = self.df_embeddings.set_index('heading').T.to_dict('list')

    def get_embedding(self, text: str, model: str=EMBEDDING_MODEL) -> list[float]:
        result = openai.Embedding.create(
            model=model,
            input=text
            )
        
        return result["data"][0]["embedding"]

    def vector_similarity(self, x: list[float], y: list[float]) -> float:
        """
        Returns the similarity between two vectors.
        
        Because OpenAI Embeddings are normalized to length 1, the cosine similarity is the same as the dot product.
        """
        return np.dot(np.array(x), np.array(y))
    
    def order_document_sections_by_query_similarity(self, query: str, contexts: dict[(str, str), np.array]) -> list[(float, (str, str))]:
        """
        Find the query embedding for the supplied query, and compare it against all of the pre-calculated document embeddings
        to find the most relevant sections. 
        
        Return the list of document sections, sorted by relevance in descending order.
        """
        query_embedding = self.get_embedding(query)

        document_similarities = sorted([
            (self.vector_similarity(query_embedding, doc_embedding), doc_index) for doc_index, doc_embedding in contexts.items()
        ], reverse=True)
        return document_similarities

    def construct_prompt(self, question: str, context_embeddings: dict, df: pd.DataFrame) -> str:
        """
        Fetch relevant 
        """
        most_relevant_document_sections = self.order_document_sections_by_query_similarity(question, context_embeddings)
        
        chosen_sections = []
        chosen_sections_len = 0
        chosen_sections_indexes = []
        
        for _, section_index in most_relevant_document_sections:
            # Add contexts until we run out of space.        
            document_section = df.loc[section_index]
            
            chosen_sections_len += document_section.tokens + separator_len
            if chosen_sections_len > MAX_SECTION_LEN:
                break
                
            chosen_sections.append(SEPARATOR + document_section.content.replace("\n", " "))
            chosen_sections_indexes.append(str(section_index))

        header = """Answer the question as accurately as possible using the provided context, 
        and if the answer is not contained within the text below, say "
        I can't answer that question unfortunately, but I'm happy to try answering a different question 
        you might have!" Modify your responses, while remaining accurate, based on the following characteristics
        of the user:
        Age: 42
        Gender: Woman
        Race: White
        Perceived Susceptibity to Breast Cancer: LOW
        Perceived Severity of Breast Cancer: LOW
        Perceived Benefits of Breast Cancer Screening: MEDIUM
        Perceived Barriers of Breast Cancer Screening: HIGH
        \n\nContext:\n"""
        
        return header + "".join(chosen_sections) + "\n\n Q: " + question + "\n A:"

    def answer_query_with_context(self, 
        query: str,
        df: pd.DataFrame,
        document_embeddings: dict[str, np.array],
        ### Set show_prompt to True if you want to see the exact prompt that we are feeding to ChatGPT and the context we are feeding it.
        show_prompt: bool = False
    ) -> str:
        
        prompt = self.construct_prompt(
            query,
            document_embeddings,
            df
        )
        
        if show_prompt:
            print(prompt)

        response = openai.Completion.create(
                    prompt=prompt,
                    **COMPLETIONS_API_PARAMS
                )

        return response["choices"][0]["text"].strip(" \n")
    
    def generatePrompt(self, question):
        df = self.df_text.set_index(["heading"])
        answer = self.answer_query_with_context(question, df, self.embeddings_dict)
        print(answer, end="")
        return answer

@sio.event
def my_event(sid, data):
    # Handle Socket.IO events here
    print('Received data from Node.js:', data)
    data = str(data)
    result = requester.generatePrompt(data)
    sio.emit('my_response', data=result, to=sid)

if __name__ == '__main__':
    import eventlet
    import eventlet.wsgi
    requester = FaqResponse()
    
    # Replace with your desired port number
    eventlet.wsgi.server(eventlet.listen(('localhost', 6000)), app)