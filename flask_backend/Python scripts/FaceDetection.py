from PIL import Image
from numpy import asarray
from mtcnn.mtcnn import MTCNN
from keras_facenet import FaceNet
import pandas as pd
from scipy.spatial.distance import cosine
import ast

detector = MTCNN()
embedder = FaceNet()
df = pd.read_csv("Test_Dataset/face_embeddings.csv")

def get_face_embedding(image_path):
    try:
        image = Image.open(image_path)
    except FileNotFoundError:
        return None

    image = image.convert('RGB')
    pixels = asarray(image)
    
    results = detector.detect_faces(pixels)
    
    if not results:
        return None
        
    x1, y1, width, height = results[0]['box']
    x1, y1 = abs(x1), abs(y1)
    x2, y2 = x1 + width, y1 + height
    
    face = pixels[y1:y2, x1:x2]
    
    face_image = Image.fromarray(face)
    face_image = face_image.resize((160, 160))
    face_array = asarray(face_image)
    
    samples = asarray([face_array], 'float32')
    
    embedding = embedder.embeddings(samples)
    
    return embedding[0]

def find_most_similar(new_embedding, database_embeddings, similarity_threshold=0.5):
    if new_embedding is None or not database_embeddings:
        return None, 0.0

    best_match_id = None
    highest_similarity = -1

    for face_id, db_embedding in database_embeddings.items():
        similarity = 1 - cosine(new_embedding, db_embedding)
        
        if similarity > highest_similarity:
            highest_similarity = similarity
            best_match_id = face_id

    if highest_similarity >= similarity_threshold:
        return best_match_id, highest_similarity
    else:
        return None, highest_similarity

def load_embeddings_from_dataframe(dataframe):
    database = {}
    for index, row in dataframe.iterrows():
        face_id = row['face_id'].replace('.jpg', '')
        embedding_str = row['embedding']
        try:
            embedding_list = ast.literal_eval(embedding_str)
            database[face_id] = asarray(embedding_list, dtype='float32')
        except (ValueError, SyntaxError):
            continue
    return database

def identify_entity_from_image(image_path):
    new_face_embedding = get_face_embedding(image_path)

    if new_face_embedding is None:
        return "No Face detected"

    stored_embeddings = load_embeddings_from_dataframe(df)
    
    match_id, score = find_most_similar(new_face_embedding, stored_embeddings)
    
    if match_id:
        entity_id = match_id.replace('F', 'E', 1)
        return entity_id
    else:
        return f"No confident match found (best score: {score:.4f})"

# image_to_test = r'C:\Users\Lenovo\Downloads\test2.jpg'
# result = identify_entity_from_image(image_to_test)
# print(result)
