-- name: GetUserByEmail :one
SELECT "id", "email", "password", "displayName", "characterType", "characterName",
       "emailVerified", "verificationCode", "verificationExpiry", "verificationAttempts",
       "resetCode", "resetCodeExpiry", "createdAt", "updatedAt", "googleId", "resetAttempts", "tokenVersion"
FROM "User"
WHERE "email" = $1;

-- name: GetUserByID :one
SELECT "id", "email", "password", "displayName", "characterType", "characterName",
       "emailVerified", "verificationCode", "verificationExpiry", "verificationAttempts",
       "resetCode", "resetCodeExpiry", "createdAt", "updatedAt", "googleId", "resetAttempts", "tokenVersion"
FROM "User"
WHERE "id" = $1;

-- name: GetUserByGoogleID :one
SELECT "id", "email", "password", "displayName", "characterType", "characterName",
       "emailVerified", "verificationCode", "verificationExpiry", "verificationAttempts",
       "resetCode", "resetCodeExpiry", "createdAt", "updatedAt", "googleId", "resetAttempts", "tokenVersion"
FROM "User"
WHERE "googleId" = $1;

-- name: GetUserTokenVersion :one
SELECT "tokenVersion" FROM "User" WHERE "id" = $1;
