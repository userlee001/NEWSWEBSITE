CREATE TYPE user_role AS ENUM ( 'writer' , 'Admin' );
CREATE TYPE category AS ENUM ('politics', 'sports', 'finance');

CREATE TABLE writer (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	authorname TEXT NOT NULL UNIQUE,
	password TEXT NOT NULL,
	role user_role DEFAULT 'writer'
);

CREATE TABLE news_metadata (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	title TEXT NOT NULL,
	author_id UUID REFERENCES writer(id) ON DELETE CASCADE,
	created_at TIMESTAMPTZ DEFAULT now(),
	category category NOT NULL,
	cover_image_path TEXT NOT NULL
);

CREATE TABLE passage_content (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	content_image_path TEXT NOT NULL, 
	content TEXT NOT NULL, 
	number INT NOT NULL,
	news_id UUID REFERENCES news_metadata(id) ON DELETE CASCADE,
	UNIQUE (number, news_id)
);
