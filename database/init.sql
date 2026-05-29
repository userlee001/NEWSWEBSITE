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

CREATE TABLE audit_log (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID DEFAULT NULL,
	action TEXT NOT NULL,
	api_path TEXT NOT NULL,
	request_method TEXT NOT NULL,
	created_at TIMESTAMPTZ DEFAULT now(),
	status_code INTEGER NOT NULL,
	ip TEXT DEFAULT NULL,
	user_agent TEXT DEFAULT NULL
);

CREATE TABLE audit_log_target_information (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	audit_log_id UUID REFERENCES audit_log(id) ON DELETE CASCADE,
	target_table TEXT NOT NULL,
	target_data_id UUID NOT NULL
);
