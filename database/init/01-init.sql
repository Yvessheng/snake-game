-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    highest_score INTEGER DEFAULT 0,
    total_games INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 分数记录表
CREATE TABLE IF NOT EXISTS scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    snake_length INTEGER NOT NULL,
    game_duration INTEGER NOT NULL,
    game_mode VARCHAR(20) DEFAULT 'classic',
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 成就表
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_key VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_key)
);

-- 排行榜物化视图（Top 100）
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_top_100 AS
SELECT
    u.id,
    u.username,
    u.avatar_url,
    s.score,
    s.snake_length,
    s.game_duration,
    s.played_at,
    RANK() OVER (ORDER BY s.score DESC, s.played_at ASC) as rank
FROM users u
JOIN scores s ON u.id = s.user_id
WHERE s.score = (
    SELECT MAX(s2.score)
    FROM scores s2
    WHERE s2.user_id = u.id
)
ORDER BY s.score DESC, s.played_at ASC
LIMIT 100;

-- 刷新排行榜函数
CREATE OR REPLACE FUNCTION refresh_leaderboard() RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_top_100;
END;
$$ LANGUAGE plpgsql;

-- 索引
CREATE INDEX idx_scores_user_id ON scores(user_id);
CREATE INDEX idx_scores_score ON scores(score DESC);
CREATE INDEX idx_scores_played_at ON scores(played_at DESC);
CREATE INDEX idx_users_highest_score ON users(highest_score DESC);
