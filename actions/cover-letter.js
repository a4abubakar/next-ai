"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_APi_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
})

export const generateCoverLetter = async (data) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId }
    });
    if (!user) throw new Error("User not found");

    const prompt = `
        Write a professional cover letter for a ${data.jobTitle} position at ${data.companyName
        }.
        
        About the candidate:
        - Industry: ${user.industry}
        - Years of Experience: ${user.experience}
        - Skills: ${user.skills?.join(", ")}
        - Professional Background: ${user.bio}
        
        Job Description:
        ${data.jobDescription}
        
        Requirements:
        1. Use a professional, enthusiastic tone
        2. Highlight relevant skills and experience
        3. Show understanding of the company's needs
        4. Keep it concise (max 400 words)
        5. Use proper business letter formatting in markdown
        6. Include specific examples of achievements
        7. Relate candidate's background to job requirements
        
        Format the letter in markdown.
    `;

    try {
        const result = await model.generateContent(prompt);
        const content = result.response.text().trim();
        const coverLetter = await db.coverLetter.create({
            data: {
                userId: user.id,
                jobTitle: data.jobTitle,
                companyName: data.companyName,
                jobDescription: data.jobDescription,
                status: "completed",
                content,
            }
        });
        return coverLetter;
    } catch (error) {
        console.log("Error generating cover letter", error.message);
        throw new Error("Failed to generate cover letter!" + error.message);
    }
}

export const getCoverLetters = async () => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId }
    });
    if (!user) throw new Error("User not found");

    const coverLetters = await db.coverLetter.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" }
    });
    return coverLetters;
}

export const getCoverLetter = async (id) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId }
    });
    if (!user) throw new Error("User not found");

    const coverLetter = await db.coverLetter.findUnique({
        where: { id, userId: user.id }
    });

    if (!coverLetter) throw new Error("Cover letter not found");
    return coverLetter;
}

export const deleteCoverLetter = async (id) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId }
    });
    if (!user) throw new Error("User not found");

    await db.coverLetter.delete({
        where: { id, userId: user.id }
    });
}