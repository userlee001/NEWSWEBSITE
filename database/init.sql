CREATE TYPE user_role AS ENUM ( 'user' , 'Admin' );

CREATE TABLE writer (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	authorname TEXT NOT NULL UNIQUE,
	password TEXT NOT NULL,
	role user_role DEFAULT 'user'
);

CREATE TABLE news (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	title TEXT NOT NULL,
	author_id UUID REFERENCES writer(id),
	created_at TIMESTAMPTZ DEFAULT now(),
	category INT NOT NULL,
	cover_image_path TEXT NOT NULL,
	content TEXT NOT NULL 
);
