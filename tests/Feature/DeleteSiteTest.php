<?php

namespace Tests\Feature;

use App\Models\Site;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeleteSiteTest extends TestCase
{
    use RefreshDatabase;

    public function test_that_site_is_deleted()
    {
        $site = Site::factory()->create();

        $response = $this->delete("/$site->id");

        $this->assertDatabaseCount('sites', 0);
    }

    public function test_that_no_site_is_deleted_if_id_mismatch()
    {
        $site = Site::factory()->create();

        $response = $this->delete("/23{$site->id}");
        $this->assertDatabaseCount('sites', 1);
        $this->assertDatabaseHas('sites', [
            'id' => $site->id,
        ]);
    }
}
