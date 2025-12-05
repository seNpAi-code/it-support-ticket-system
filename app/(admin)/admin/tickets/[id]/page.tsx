import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { addComment, updateTicketStatus, assignTicket } from "@/app/actions";
import { notFound, redirect } from "next/navigation";

export default async function AdminTicketDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    // @ts-ignore
    if (session?.user?.role !== 'admin') {
        redirect('/dashboard');
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

    // Fetch comments
    const { data: comments, error: commentsError } = await supabaseAdmin
        .from('comments')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
                <div className="lg:col-span-8">
                    {/* Ticket Details */}
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

                    {/* Comments */}
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

                <div className="lg:col-span-4 mt-6 lg:mt-0">
                    {/* Admin Controls */}
                    <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
                        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Admin Actions</h3>

                        <form action={updateTicketStatus} className="mb-6">
                            <input type="hidden" name="ticketId" value={ticket.id} />
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                Update Status
                            </label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <select
                                    id="status"
                                    name="status"
                                    className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    defaultValue={ticket.status}
                                >
                                    <option>Open</option>
                                    <option>In Progress</option>
                                    <option>Resolved</option>
                                </select>
                                <button
                                    type="submit"
                                    className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    Save
                                </button>
                            </div>
                        </form>

                        <form action={assignTicket}>
                            <input type="hidden" name="ticketId" value={ticket.id} />
                            <label htmlFor="assigneeEmail" className="block text-sm font-medium text-gray-700">
                                Assign To (Email)
                            </label>
                            <div className="mt-1">
                                <input
                                    type="email"
                                    name="assigneeEmail"
                                    id="assigneeEmail"
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="admin@example.com"
                                    defaultValue={ticket.assigned_to_email || ''}
                                />
                            </div>
                            <div className="mt-3 text-right">
                                <button
                                    type="submit"
                                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    Assign
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
