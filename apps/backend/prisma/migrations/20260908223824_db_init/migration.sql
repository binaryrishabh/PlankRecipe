-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT,
    "description" TEXT,
    "servings" TEXT,
    "prepTime" TEXT,
    "cookTime" TEXT,
    "ingredients" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tweak" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,

    CONSTRAINT "Tweak_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_url_key" ON "Recipe"("url");

-- AddForeignKey
ALTER TABLE "Tweak" ADD CONSTRAINT "Tweak_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
