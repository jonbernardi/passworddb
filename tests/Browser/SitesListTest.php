<?php

namespace Tests\Browser;

use App\Models\Site;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class SitesListTest extends DuskTestCase
{
    use DatabaseMigrations;

    /**
     * A Dusk test example.
     *
     * @return void
     */
    public function test_that_sites_page_is_loaded()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('/')
                ->assertSee('Password Database');
        });
    }

    public function test_that_sites_are_listed()
    {
        $first = Site::factory()->create(['name' => 'first site']);
        $second = Site::factory()->create(['name' => 'second site']);

        $this->browse(function (Browser $browser) use ($first, $second) {
            $browser->visit('/')
                ->assertSee($first->name)
                ->assertSee($second->name);
        });
    }

    public function test_site_search()
    {
        $first = Site::factory()->create(['name' => 'first site']);
        $second = Site::factory()->create(['name' => 'second site']);

        $this->browse(function (Browser $browser) use ($first, $second) {
            $browser->visit('/')
                ->type('s', 'first')
                ->assertSee($first->name)
                ->assertDontSee($second->name);
        });
    }
}
