"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { FormCard } from "@/components/form-card";
import { PageSpinner } from "@/components/page-spinner";
import { Button } from "@/components/ui/button";
import { GuestNotice, MembersOnly } from "@/features/auth/members-only";
import { MeetingForm } from "@/features/meetings/meeting-form";
import { meetingsApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/api/client";
import type { Meeting } from "@/lib/types";

export default function EditMeetingPage({ params }: PageProps<"/meetings/[id]/edit">) {
  const { id } = use(params);
  return (
    <MembersOnly
      fallback={
        <FormCard title="Edit Meeting" description="Guests can view and join meetings, but can't edit them.">
          <GuestNotice message="Log in with an account to update interview details." />
        </FormCard>
      }
    >
      <EditMeeting id={id} />
    </MembersOnly>
  );
}

function EditMeeting({ id }: { id: string }) {
  const [state, setState] = useState<{ meeting?: Meeting; error?: string }>({});

  useEffect(() => {
    let active = true;
    meetingsApi
      .get(id)
      .then((meeting) => active && setState({ meeting }))
      .catch((error) => active && setState({ error: getErrorMessage(error) }));
    return () => {
      active = false;
    };
  }, [id]);

  if (state.error) {
    return (
      <FormCard title="Meeting unavailable" description={state.error}>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </FormCard>
    );
  }

  if (!state.meeting) {
    return (
      <PageSpinner label="Loading" />
    );
  }

  return (
    <FormCard title="Edit Meeting" description={`Interview with ${state.meeting.candidate.name}`}>
      <MeetingForm key={state.meeting.id} meeting={state.meeting} />
    </FormCard>
  );
}
