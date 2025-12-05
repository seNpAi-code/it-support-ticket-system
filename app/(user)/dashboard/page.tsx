import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

export default async function Dashboard() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return <div>Please sign in to view your tickets.</div>;
    }

    const { data: tickets, error } = await supabaseAdmin
        .from('tickets')
        .select('*')
        .eq('created_by_email', session.user.email)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching tickets:", error);
        return <div>Error loading tickets.</div>;
    }

    return (
        <div>
            <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        My Tickets
                    </h2>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0">
                    <Link
                        href="/tickets/create"
                        className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        New Ticket
                    </Link>
                </div>
            </div>

            <div className="overflow-hidden bg-white shadow sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {tickets && tickets.length > 0 ? (
                        tickets.map((ticket) => (
                            <li key={ticket.id}>
                                <Link href={`/tickets/${ticket.id}`} className="block hover:bg-gray-50">
                                    <div className="flex items-center px-4 py-4 sm:px-6">
                                        <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div className="truncate">
                                                <div className="flex text-sm">
                                                    <p className="truncate font-medium text-indigo-600">{ticket.title}</p>
                                                    <p className="ml-1 flex-shrink-0 font-normal text-gray-500">
                                                        #{ticket.id}
                                                    </p>
                                                </div>
                                                <div className="mt-2 flex">
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <p>
                                                            Created on <time dateTime={ticket.created_at}>{new Date(ticket.created_at).toLocaleDateString()}</time>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex-shrink-0 sm:ml-5 sm:mt-0">
                                                <div className="flex overflow-hidden -space-x-1">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ticket.status === 'Open' ? 'bg-green-100 text-green-800' :
                                                            ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {ticket.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-5 flex-shrink-0">
                                            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.16 8 7.23 4.29a.75.75 0 011.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))
                    ) : (
                        <li className="px-4 py-8 text-center text-gray-500">
                            No tickets found. Create one to get started.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
