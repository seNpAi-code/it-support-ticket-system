import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { addComment } from "@/app/actions";
import { notFound, redirect } from "next/navigation";

export default async function TicketDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect('/api/auth/signin');
    }

    // Fetch ticket
    const { data: ticket, error: ticketError } = await supabaseAdmin
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();

    if (ticketError || !ticket) {
        notFound();
    }

    // Check permission (Creator or Admin)
    // @ts-ignore
    if (ticket.created_by_email !== session.user.email && session.user.role !== 'admin') {
        return <div className="p-6">You do not have permission to view this ticket.</div>;
    }

    // Fetch comments
    const { data: comments, error: commentsError } = await supabaseAdmin
        .from('comments')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

    return (
        <div className="max-w-3xl mx-auto">
            {/* Ticket Header */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            #{ticket.id} - {ticket.title}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Created by {ticket.created_by_email} on {new Date(ticket.created_at).toLocaleString()}
                        </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ticket.status === 'Open' ? 'bg-green-100 text-green-800' :
                            ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                        }`}>
                        {ticket.status}
                    </span>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Priority</dt>
                            <dd className="mt-1 text-sm text-gray-900">{ticket.priority}</dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                            <dd className="mt-1 text-sm text-gray-900">{ticket.assigned_to_email || 'Unassigned'}</dd>
                        </div>
                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">Description</dt>
                            <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{ticket.description}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Comments</h3>
                </div>
                <div className="border-t border-gray-200">
                    <ul role="list" className="divide-y divide-gray-200">
                        {comments && comments.map((comment) => (
                            <li key={comment.id} className="px-4 py-4 sm:px-6">
                                <div className="flex space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs">
                                            {comment.user_email.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            {comment.user_email}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(comment.created_at).toLocaleString()}
                                        </p>
                                        <div className="mt-2 text-sm text-gray-700">
                                            <p>{comment.content}</p>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {(!comments || comments.length === 0) && (
                            <li className="px-4 py-8 text-center text-gray-500 text-sm">
                                No comments yet.
                            </li>
                        )}
                    </ul>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <form action={addComment}>
                        <input type="hidden" name="ticketId" value={ticket.id} />
                        <div>
                            <label htmlFor="comment" className="sr-only">Add your comment</label>
                            <textarea
                                id="comment"
                                name="content"
                                rows={3}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                placeholder="Add a comment..."
                                required
                            />
                        </div>
                        <div className="mt-3 flex justify-end">
                            <button
                                type="submit"
                                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                Post Comment
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
