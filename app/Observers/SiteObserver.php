<?php

namespace App\Observers;

use App\Models\Site;

class SiteObserver
{
    /**
     * Listen to the Site deleting event.
     *
     * @return void
     */
    public function deleting(Site $site)
    {
        $site->sections()->delete();
    }
}
