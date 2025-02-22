-- Drops nodes table
DROP TABLE IF EXISTS lionweb_nodes;
DROP TABLE IF EXISTS lionweb_containments;
DROP TABLE IF EXISTS lionweb_properties;
DROP TABLE IF EXISTS lionweb_references;

-- Creates nodes table
CREATE TABLE IF NOT EXISTS lionweb_nodes (
    id text  NOT NULL PRIMARY KEY, 
    classifier_language text NOT NULL,
    classifier_version text NOT NULL,
    classifier_key text NOT NULL,
    annotations text[],
    parent text
);

-- Creates containments table
CREATE TABLE IF NOT EXISTS lionweb_containments (
    c_id SERIAL NOT NULL PRIMARY KEY,
    containment jsonb NOT NULL,
    children text[],
	node_id text
);

-- Creates properties table
CREATE TABLE IF NOT EXISTS lionweb_properties (
    p_id SERIAL NOT NULL PRIMARY KEY,
    property jsonb NOT NULL,
    value text,
	node_id text
);

-- Creates references table
CREATE TABLE IF NOT EXISTS lionweb_references (
    r_id SERIAL NOT NULL PRIMARY KEY, 
    lw_reference jsonb NOT NULL,
    targets text[],
	node_id text
);
