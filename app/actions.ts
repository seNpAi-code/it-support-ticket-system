'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTicket(formData: FormData) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        throw new Error("Not authenticated");
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;

    if (!title || !description || !priority) {
        throw new Error("Missing required fields");
    }

    const { data, error } = await supabaseAdmin
        .from('tickets')
        .insert([
            {
                title,
                description,
                priority,
                created_by_email: session.user.email,
                status: 'Open',
            },
        ])
        .select()
        .single();

    if (error) {
        console.error("Error creating ticket:", error);
        throw new Error("Failed to create ticket");
    }

    revalidatePath('/dashboard');
    redirect(`/tickets/${data.id}`);
}

export async function addComment(formData: FormData) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        throw new Error("Not authenticated");
    }

    const ticketId = formData.get("ticketId") as string;
    const content = formData.get("content") as string;

    if (!ticketId || !content) {
        throw new Error("Missing required fields");
    }

    const { error } = await supabaseAdmin
        .from('comments')
        .insert([
            {
                ticket_id: parseInt(ticketId),
                user_email: session.user.email,
                content,
            },
        ]);

    if (error) {
        console.error("Error adding comment:", error);
        throw new Error("Failed to add comment");
    }

    revalidatePath(`/tickets/${ticketId}`);
}

export async function updateTicketStatus(formData: FormData) {
    const session = await getServerSession(authOptions);

    // @ts-ignore
    if (session?.user?.role !== 'admin') {
        throw new Error("Unauthorized");
    }

    const ticketId = formData.get("ticketId") as string;
    const status = formData.get("status") as string;

    if (!ticketId || !status) {
        throw new Error("Missing required fields");
    }

    const { error } = await supabaseAdmin
        .from('tickets')
        .update({ status })
        .eq('id', ticketId);

    if (error) {
        console.error("Error updating status:", error);
        throw new Error("Failed to update status");
    }

    revalidatePath(`/admin/tickets/${ticketId}`);
    revalidatePath(`/admin`);
}

export async function assignTicket(formData: FormData) {
    const session = await getServerSession(authOptions);

    // @ts-ignore
    if (session?.user?.role !== 'admin') {
        throw new Error("Unauthorized");
    }

    const ticketId = formData.get("ticketId") as string;
    const assigneeEmail = formData.get("assigneeEmail") as string;

    if (!ticketId || !assigneeEmail) {
        throw new Error("Missing required fields");
    }

    const { error } = await supabaseAdmin
        .from('tickets')
        .update({ assigned_to_email: assigneeEmail })
        .eq('id', ticketId);

    if (error) {
        console.error("Error assigning ticket:", error);
        throw new Error("Failed to assign ticket");
    }

    revalidatePath(`/admin/tickets/${ticketId}`);
}
