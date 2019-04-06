const express = require('express');
const router = express.Router();
const passport = require('passport');
const mongoose = require('mongoose');

// Load input validation
const validatePostInput = require('../../validation/post');

// Load User model
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');

// @route GET api/posts/test
// @description Test posts route
// @access Public
router.get('/test', (req, res) => {
  res.json({ msg: 'posts works' });
});

// @route GET api/posts
// @description Get all posts
// @access Public
router.get('/', (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then((posts) => {
      res.json(posts);
    })
    .catch((err) => {
      res.json(err);
    });
});

// @route GET api/posts/:id
// @description Get a post by id
// @access Public
router.get('/:id', (req, res) => {
  Post.findById(req.params.id)
    .then((post) => {
      res.json(post);
    })
    .catch((err) => {
      res.json(err);
    });
});

// @route POST api/posts
// @description create post
// @access Private
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);
    // check validation
    if (!isValid) {
      // return erros object
      return res.status(400).json(errors);
    }
    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user._id
    });
    newPost.save().then((post) => {
      res.json(post);
    });
  }
);

// @route POST api/posts/like/:id
// @description Like a post
// @access Private
router.post(
  '/like/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user._id }).then((profile) => {
      Post.findById(req.params.id)
        .then((post) => {
          //check if user already liked this post
          if (
            post.likes.filter((like) => {
              like.user.toString() === req.user._id;
            }).lenght > 0
          ) {
            return res
              .status(400)
              .json({ alreadyliked: 'User already liked this post' });
          }
          //adduser id to the likes array
          post.likes.unshift({ user: req.user._id });
          post.save().then((post) => {
            res.json(post);
          });
        })
        .catch((err) => {
          res.json(err);
        });
    });
  }
);
// @route POST api/posts/like/:id
// @description Like a post
// @access Private
router.post(
  '/unlike/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user._id }).then((profile) => {
      Post.findById(req.params.id)
        .then((post) => {
          //check if user already liked this post
          if (
            post.likes.filter((like) => {
              like.user.toString() === req.user._id;
            }).lenght === 0
          ) {
            return res
              .status(400)
              .json({ notliked: 'You have not yet liked this post' });
          }
          //get remove index
          const removeIndex = post.likes
            .map((item) => {
              item.user.toString();
            })
            .indexOf(req.user.id);
          //  Splice out of array
          post.likes.splice(removeIndex, 1);
          // Save
          post.save().then((post) => {
            res.json(post);
          });
        })
        .catch((err) => {
          res.json(err);
        });
    });
  }
);

// @route POST api/posts/comment/:id
// @description Add comment to post
// @access Private
router.post(
  '/comment/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);
    // check validation
    if (!isValid) {
      // return erros object
      return res.status(400).json(errors);
    }
    Post.findById(req.params.id)
      .then((post) => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user._id
        };
        // add to comment array
        post.comments.unshift(newComment);
        post.save().then((post) => {
          res.json(post);
        });
      })
      .catch((err) => {
        res.json(err);
      });
  }
);

// @route DELETE api/posts/comment/:id/:comment_id
// @description Add comment to post
// @access Private
router.delete(
  '/comment/:id/:comment_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Post.findById(req.params.id).then((post) => {
      //check if comment exist
      if (
        post.comments.filter((comment) => {
          comment._id.toString() === req.params.comment_id;
        }).lenght === 0
      ) {
        return res.status(404).json({ no_comment: 'Comment does nto exist' });
      }
      //get remove index
      const removeIndex = post.comments
        .map((item) => {
          item._id.toString();
        })
        .indexOf(req.params.comment_id);
      //splice oput of array
      post.comments.splice(removeIndex, 1);
      post.save().then((post) => {
        res.json(post);
      });
    });
  }
);

// @route DELETE api/posts/:id
// @description Delete a post
// @access Private
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user._id }).then((profile) => {
      Post.findById(req.params.id).then((post) => {
        //check for post owner
        if (post.user.toString() !== req.user.id) {
          return res
            .status(401)
            .json({ not_authorized: 'User not authorized' });
        }
        post
          .remove()
          .then(() => {
            res.json({ succes: 'Post removed' });
          })
          .catch((err) => {
            res.json(err);
          });
      });
    });
  }
);

module.exports = router;